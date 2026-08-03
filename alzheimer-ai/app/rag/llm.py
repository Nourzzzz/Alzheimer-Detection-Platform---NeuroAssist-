import logging
import time

import httpx

from app.config import (
    OLLAMA_KEEP_ALIVE,
    OLLAMA_MODEL,
    OLLAMA_NUM_PREDICT,
    OLLAMA_TIMEOUT_S,
    OLLAMA_URL,
    RAG_USE_OLLAMA,
)

logger = logging.getLogger(__name__)

# The report is read by the doctor, so it follows the console's language.
_LANGUAGE_INSTRUCTION = {
    "fr": "Write the entire report in FRENCH, in professional clinical French.",
    "en": "Write the entire report in ENGLISH.",
}


def _build_prompt(context: dict) -> str:
    cnn = context.get("cnn_prediction", "?")
    risk = context.get("risk_score", "?")
    probs = context.get("probabilities", {})
    clinical = context.get("clinical_bert", {})
    answers = context.get("questionnaire_answers", []) or []
    retrieved = context.get("retrieved_context", []) or []

    prob_str = ", ".join(f"{k}={v:.2f}" for k, v in probs.items()) if probs else "n/a"
    symptoms = ", ".join(clinical.get("symptoms", [])) or "none extracted"
    treatments = ", ".join(clinical.get("treatments", [])) or "none extracted"
    conditions = ", ".join(clinical.get("conditions", [])) or "none extracted"
    history = ", ".join(clinical.get("history", [])) or "none extracted"
    ctx_str = "\n".join(f"- [{h.get('source', 'KB')}] {h.get('snippet', '')}" for h in retrieved) or "- (no indexed medical context matched)"
    ans_str = "\n".join(f"- {a}" for a in answers) or "- (no questionnaire on file)"
    cognitive_str = _format_cognitive(context) or "not administered"

    lang = (context.get("lang") or "fr").lower()
    language_line = _LANGUAGE_INSTRUCTION.get(lang, _LANGUAGE_INSTRUCTION["fr"])

    base = (
        "You are a clinical decision-support assistant. Draft a concise, cautious "
        "Alzheimer assessment for a physician to review. Do NOT give a definitive "
        f"diagnosis; frame findings as AI-generated and requiring validation. {language_line}\n\n"
        f"MRI CNN prediction: {cnn} (class probabilities: {prob_str})\n"
        f"Computed risk score (0-100): {risk}\n"
        f"Cognitive questionnaire assessment: {cognitive_str}\n"
        f"Extracted symptoms: {symptoms}\n"
        f"Noted treatments: {treatments}\n"
        f"Mentioned conditions/diagnoses: {conditions}\n"
        f"Relevant medical history / comorbidities: {history}\n"
        f"Questionnaire answers:\n{ans_str}\n"
        f"Relevant medical knowledge (retrieved):\n{ctx_str}\n\n"
    )

    revision = _revision_block(context)
    if revision:
        return base + revision

    return base + (
        "Write: (1) a one-paragraph summary, (2) key contributing factors "
        "(weigh the comorbidities), (3) suggested next steps for the physician."
    )


def _revision_block(context: dict) -> str:
    """Extra instructions when a physician rejected the previous draft. The
    feedback is an explicit instruction to follow, not just extra context."""
    feedback = (context.get("doctor_feedback") or "").strip()
    if not feedback:
        return ""
    previous = (context.get("previous_report") or "").strip()
    previous_block = f"PREVIOUS DRAFT (rejected):\n{previous}\n\n" if previous else ""
    return (
        f"{previous_block}"
        "The reviewing physician REJECTED the draft above with this feedback:\n"
        f"\"{feedback}\"\n\n"
        "Write a REVISED assessment that explicitly addresses every point the "
        "physician raised. Where their feedback contradicts the model output, "
        "follow the physician. Keep the same structure: (1) a one-paragraph "
        "summary, (2) key contributing factors, (3) suggested next steps. Do not "
        "mention this revision process or apologise - produce the corrected "
        "assessment itself."
    )


def _format_cognitive(context: dict) -> str:
    summary = context.get("cognitive_summary")
    if not summary:
        return ""
    level = context.get("cognitive_risk_level")
    red_flags = context.get("cognitive_red_flags") or []
    flags_str = f" Red flags: {', '.join(red_flags)}." if red_flags else ""
    return f"{level or 'unknown'} risk - {summary}{flags_str}"


def _templated_report(context: dict, prompt: str) -> str:
    cnn = context.get("cnn_prediction", "?")
    risk = context.get("risk_score", "?")
    clinical = context.get("clinical_bert", {})
    retrieved = context.get("retrieved_context", []) or []
    symptoms = ", ".join(clinical.get("symptoms", [])) or "none extracted from the clinical note"
    cognitive_str = _format_cognitive(context)

    stage_label = {"CN": "cognitively normal", "MCI": "mild cognitive impairment",
                   "AD": "Alzheimer's disease pattern"}.get(cnn, cnn)
    n_ctx = len(retrieved)
    cognitive_sentence = f"Cognitive questionnaire: {cognitive_str}. " if cognitive_str else ""
    feedback = (context.get("doctor_feedback") or "").strip()
    revision_sentence = (
        f"\n\nPhysician feedback on the previous draft: \"{feedback}\" "
        "(this fallback report cannot rewrite itself around that feedback - "
        "enable the LLM to obtain a genuinely revised assessment.)"
        if feedback else ""
    )
    return (
        "[AI-GENERATED DRAFT — REQUIRES PHYSICIAN VALIDATION]\n\n"
        "Summary: The MRI-based CNN classifies this scan as "
        f"'{cnn}' ({stage_label}), with a computed risk score of {risk}/100. "
        f"{cognitive_sentence}"
        f"Clinical-note extraction surfaced: {symptoms}. "
        f"{n_ctx} relevant passage(s) were retrieved from the indexed medical knowledge base.\n\n"
        "Key contributing factors: imaging-derived class probabilities and the "
        "risk score are the primary drivers; questionnaire responses and extracted "
        "symptoms provide supporting context.\n\n"
        "Suggested next steps: correlate with clinical history, consider "
        "confirmatory testing where indicated, and validate or correct this "
        "AI assessment before it is released to the patient."
        f"{revision_sentence}\n\n"
        "(Placeholder report generated without an LLM. Enable RAG_USE_OLLAMA to "
        "produce a model-written narrative from the same inputs.)"
    )


def generate_report(context: dict) -> str:
    prompt = _build_prompt(context)
    if not RAG_USE_OLLAMA:
        return _templated_report(context, prompt)
    try:
        logger.info("Generating LLaMA report via Ollama (%s, model=%s)...", OLLAMA_URL, OLLAMA_MODEL)
        t0 = time.monotonic()
        resp = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "keep_alive": OLLAMA_KEEP_ALIVE,
                "options": {"num_predict": OLLAMA_NUM_PREDICT},
            },
            timeout=OLLAMA_TIMEOUT_S,
        )
        resp.raise_for_status()
        text = resp.json().get("response", "").strip()
        if not text:
            logger.warning("Ollama returned an empty response, using templated report")
            return _templated_report(context, prompt)
        logger.info("LLaMA report generated in %.0fs (%d chars)", time.monotonic() - t0, len(text))
        return text
    except Exception as e:
        logger.error("Ollama report generation FAILED (%s: %s) - falling back to the templated "
                     "placeholder. Check that Ollama is running and reachable at %s and that "
                     "'%s' is pulled.", type(e).__name__, e, OLLAMA_URL, OLLAMA_MODEL)
        return _templated_report(context, prompt)
