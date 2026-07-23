import logging

from app.config import RAG_RERANK_MIN_SCORE, RAG_RETRIEVE_K, RAG_TOP_K, RAG_USE_RERANKER
from app.rag import clinical_bert, llm, reranker
from app.rag.embeddings import get_embedding_model
from app.rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)


_STAGE_LABEL = {"CN": "cognitively normal", "MCI": "mild cognitive impairment",
                "AD": "Alzheimer's disease"}


def _build_query(payload: dict, clinical: dict) -> str:
    stage = payload.get("predicted_class", "")
    label = _STAGE_LABEL.get(stage, stage)
    bits = [f"Management and treatment recommendations for a patient with {label}".strip()]

    risk_level = payload.get("cognitive_risk_level")
    if risk_level is not None:
        bits.append(f"cognitive screening risk: {risk_level}")

    for field in ("symptoms", "conditions", "history"):
        vals = clinical.get(field) or []
        if vals:
            name = {"symptoms": "symptoms", "conditions": "diagnoses",
                    "history": "comorbidities"}[field]
            bits.append(f"{name}: {', '.join(vals)}")
    return ". ".join(bits).strip()


def _retrieve(query: str) -> list[dict]:
    if not query:
        return []
    qvec = get_embedding_model().embed(query)
    candidates = get_vector_store().search(qvec, k=RAG_RETRIEVE_K)
    if not candidates:
        return []

    if RAG_USE_RERANKER:
        ranked = reranker.rerank(query, candidates, text_of=lambda h: h.text,
                                 top_k=RAG_TOP_K, min_score=RAG_RERANK_MIN_SCORE)
    else:
        ranked = [(h, h.score) for h in candidates[:RAG_TOP_K]]

    hits = []
    for h, score in ranked:
        hits.append({
            "source": h.metadata.get("category", "GUIDELINE"),
            "doc_id": h.doc_id,
            "title": h.metadata.get("title", ""),
            "snippet": h.text[:400],
            "score": round(score, 4) if score is not None else round(h.score, 4),
        })
    return hits


def generate_assessment(payload: dict) -> dict:
    clinical = clinical_bert.extract_clinical(payload.get("clinical_note", ""))
    query = _build_query(payload, clinical)
    hits = _retrieve(query)

    report = llm.generate_report({
        "cnn_prediction": payload.get("predicted_class"),
        "probabilities": payload.get("probabilities", {}),
        "risk_score": payload.get("risk_score"),
        "clinical_bert": clinical,
        "cognitive_summary": payload.get("cognitive_summary"),
        "cognitive_risk_level": payload.get("cognitive_risk_level"),
        "cognitive_red_flags": payload.get("cognitive_red_flags", []),
        "questionnaire_answers": payload.get("questionnaire_answers", []),
        "retrieved_context": hits,
    })

    return {"clinical_bert": clinical, "rag_context": hits, "report": report}
