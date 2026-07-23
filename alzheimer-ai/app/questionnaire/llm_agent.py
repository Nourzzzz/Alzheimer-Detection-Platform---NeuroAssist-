import logging
import re
import unicodedata

import httpx

from app.config import OLLAMA_MODEL, OLLAMA_URL, RAG_USE_OLLAMA

logger = logging.getLogger(__name__)

_TURN_TIMEOUT_S = 20
_TURN_NUM_PREDICT = 40

_YES_WORDS = {"oui", "yes", "yeah", "yep", "vrai", "true", "toujours", "souvent"}
_NO_WORDS = {"non", "no", "nope", "jamais", "never", "faux", "false"}


def _ollama_generate(prompt: str) -> str | None:
    if not RAG_USE_OLLAMA:
        return None
    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False,
                 "options": {"num_predict": _TURN_NUM_PREDICT, "temperature": 0.2}},
            timeout=_TURN_TIMEOUT_S,
        )
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except Exception as e:
        logger.warning("Ollama call failed (%s), using the deterministic fallback", e)
        return None


def _deterministic_question(node: dict) -> str:
    options = node.get("options", [])
    if node.get("answerType") == "yes_no":
        return node["intent"]
    choices = " / ".join(o["label"] for o in options)
    return f"{node['intent']} ({choices})"


def phrase_question(node: dict) -> str:
    base = _deterministic_question(node)
    options = ", ".join(f'"{o["label"]}"' for o in node.get("options", []))
    prompt = (
        "Tu es un assistant clinique qui pose des questions de dépistage cognitif à un patient, "
        "en français, avec bienveillance et clarté. Reformule la consigne suivante en UNE seule "
        "question naturelle et courte, sans changer son sens, sans ajouter d'information médicale, "
        f"et sans révéler les scores.\nConsigne : {node['intent']}\n"
        f"Réponses possibles pour cadrer la question : {options}\n"
        "Réponds uniquement avec la question, rien d'autre."
    )
    text = _ollama_generate(prompt)
    if not text:
        return base
    text = text.strip().strip('"')
    if not text or len(text) > 300:
        return base
    return text


def _normalize_punct(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", s)).strip()


def _heuristic_normalize(node: dict, raw_text: str) -> str | None:
    low = _normalize_punct(raw_text)
    options = node.get("options", [])

    for opt in options:
        if _normalize_punct(opt["value"]) in low or _normalize_punct(opt["label"]) in low:
            return opt["value"]

    if node.get("answerType") == "yes_no":
        words = set(re.findall(r"[a-zàâçéèêëîïôûùüÿñæœ]+", low))
        has_yes, has_no = bool(words & _YES_WORDS), bool(words & _NO_WORDS)
        if has_yes and not has_no:
            return next((o["value"] for o in options if o["value"] == "yes"), None)
        if has_no and not has_yes:
            return next((o["value"] for o in options if o["value"] == "no"), None)
    return None


def normalize_answer(node: dict, raw_text: str) -> str | None:
    hit = _heuristic_normalize(node, raw_text)
    if hit is not None:
        return hit

    options = node.get("options", [])
    allowed = [o["value"] for o in options]
    labelled = "\n".join(f'- {o["value"]}: "{o["label"]}"' for o in options)
    prompt = (
        "Un patient répond à une question de dépistage cognitif. Fais correspondre sa réponse à "
        "EXACTEMENT une des valeurs autorisées ci-dessous, ou réponds UNCLEAR si sa réponse ne "
        "correspond clairement à aucune.\n"
        f"Question posée : {node['intent']}\n"
        f"Valeurs autorisées :\n{labelled}\n"
        f'Réponse du patient : "{raw_text}"\n'
        f"Réponds avec un seul mot parmi : {', '.join(allowed)}, UNCLEAR. Rien d'autre."
    )
    text = _ollama_generate(prompt)
    if not text:
        return None
    candidate = text.strip().strip('"').strip(".").lower()
    for value in allowed:
        if candidate == value.lower():
            return value
    return None
