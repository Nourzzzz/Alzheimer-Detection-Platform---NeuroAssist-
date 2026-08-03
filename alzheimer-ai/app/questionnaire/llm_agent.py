import hashlib
import json
import logging
import re
import threading
import time
import unicodedata

import httpx

from app.config import DATA_DIR, OLLAMA_KEEP_ALIVE, OLLAMA_MODEL, OLLAMA_URL, RAG_USE_OLLAMA

logger = logging.getLogger(__name__)

_TURN_TIMEOUT_S = 12
_PHRASE_NUM_PREDICT = 40
# Normalization answers with a single word; a small budget stops the model from
# rambling and cuts the round-trip accordingly.
_NORMALIZE_NUM_PREDICT = 8

# A questionnaire turn must stay snappy. If Ollama is down or overloaded, waiting
# for the timeout on every question would make the whole run feel broken, so we
# stop calling it for a while and serve the deterministic phrasing instead.
_BREAKER_THRESHOLD = 2
_BREAKER_COOLDOWN_S = 60
_breaker_lock = threading.Lock()
_consecutive_failures = 0
_breaker_open_until = 0.0

# Deliberately merged across languages: a French speaker may still type "yes",
# so recognising both costs nothing and avoids a needless clarification round.
_YES_WORDS = {"oui", "yes", "yeah", "yep", "vrai", "true", "toujours", "souvent", "often", "always"}
_NO_WORDS = {"non", "no", "nope", "jamais", "never", "faux", "false"}

DEFAULT_LANG = "fr"


def localized(obj: dict, field: str, lang: str) -> str:
    """Reads `field_<lang>` when present, else the default-language `field`.
    Keeps every language sharing one node id, score and branch."""
    if lang and lang != DEFAULT_LANG:
        value = obj.get(f"{field}_{lang}")
        if value:
            return value
    return obj.get(field, "")


def _breaker_is_open() -> bool:
    with _breaker_lock:
        return time.monotonic() < _breaker_open_until


def _record_outcome(success: bool) -> None:
    global _consecutive_failures, _breaker_open_until
    with _breaker_lock:
        if success:
            _consecutive_failures = 0
            _breaker_open_until = 0.0
            return
        _consecutive_failures += 1
        if _consecutive_failures >= _BREAKER_THRESHOLD:
            _breaker_open_until = time.monotonic() + _BREAKER_COOLDOWN_S
            logger.warning("Pausing questionnaire LLM calls for %ss after %s failures",
                           _BREAKER_COOLDOWN_S, _consecutive_failures)


def _ollama_generate(prompt: str, num_predict: int = _PHRASE_NUM_PREDICT) -> str | None:
    if not RAG_USE_OLLAMA or _breaker_is_open():
        return None
    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False,
                  # Without keep_alive the 8B model is evicted between turns and
                  # reloaded on the next question, which dominates the latency.
                  "keep_alive": OLLAMA_KEEP_ALIVE,
                  "options": {"num_predict": num_predict, "temperature": 0.2}},
            timeout=_TURN_TIMEOUT_S,
        )
        resp.raise_for_status()
        _record_outcome(True)
        return resp.json().get("response", "").strip()
    except Exception as e:
        logger.warning("Ollama call failed (%s), using the deterministic fallback", e)
        _record_outcome(False)
        return None


_PHRASING_CACHE_PATH = DATA_DIR / "questionnaire_phrasings.json"
_cache_lock = threading.Lock()


def _load_phrasings() -> dict[str, str]:
    try:
        with open(_PHRASING_CACHE_PATH, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


# The tree is fixed, so a given prompt always deserves the same phrasing: the
# first patient pays for the generation, everyone after is served from memory.
_PHRASINGS: dict[str, str] = _load_phrasings()


def _cache_put(key: str, value: str) -> None:
    with _cache_lock:
        if _PHRASINGS.get(key) == value:
            return
        _PHRASINGS[key] = value
        tmp = _PHRASING_CACHE_PATH.with_suffix(".tmp")
        try:
            _PHRASING_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(_PHRASINGS, f, ensure_ascii=False, indent=1)
            tmp.replace(_PHRASING_CACHE_PATH)
        except OSError as e:
            logger.warning("Could not persist the phrasing cache (%s); keeping it in memory", e)


def _deterministic_question(node: dict, lang: str = DEFAULT_LANG) -> str:
    options = node.get("options", [])
    intent = localized(node, "intent", lang)
    if node.get("answerType") == "yes_no":
        return intent
    choices = " / ".join(localized(o, "label", lang) for o in options)
    return f"{intent} ({choices})"


_PHRASE_PROMPT = {
    "fr": (
        "Tu es un assistant clinique qui pose des questions de dépistage cognitif à un patient, "
        "en français, avec bienveillance et clarté. Reformule la consigne suivante en UNE seule "
        "question naturelle et courte, sans changer son sens, sans ajouter d'information médicale, "
        "et sans révéler les scores.\nConsigne : {intent}\n"
        "Réponses possibles pour cadrer la question : {options}\n"
        "Réponds uniquement avec la question, rien d'autre."
    ),
    "en": (
        "You are a clinical assistant asking a patient cognitive screening questions in English, "
        "kindly and clearly. Rephrase the following instruction as ONE short, natural question, "
        "without changing its meaning, without adding medical information, and without revealing "
        "any score.\nInstruction: {intent}\n"
        "Possible answers, to frame the question: {options}\n"
        "Reply with the question only, nothing else."
    ),
}


def _phrase_prompt(node: dict, lang: str) -> str:
    options = ", ".join(f'"{localized(o, "label", lang)}"' for o in node.get("options", []))
    template = _PHRASE_PROMPT.get(lang, _PHRASE_PROMPT[DEFAULT_LANG])
    return template.format(intent=localized(node, "intent", lang), options=options)


def phrase_question(node: dict, lang: str = DEFAULT_LANG) -> str:
    base = _deterministic_question(node, lang)
    prompt = _phrase_prompt(node, lang)
    key = hashlib.sha1(prompt.encode("utf-8")).hexdigest()

    cached = _PHRASINGS.get(key)
    if cached:
        return cached

    text = _ollama_generate(prompt)
    if not text:
        return base
    text = text.strip().strip('"')
    if not text or len(text) > 300:
        return base

    # Only successful generations are cached: a fallback caused by a transient
    # Ollama outage must not be frozen in for good.
    _cache_put(key, text)
    return text


def warm_phrasings(nodes: list[dict], langs: tuple[str, ...] = ("fr", "en")) -> int:
    """Generates and caches every question phrasing ahead of time, so a patient
    never waits on the model. Returns how many were newly generated."""
    generated = 0
    for node in nodes:
        for lang in langs:
            prompt = _phrase_prompt(node, lang)
            if hashlib.sha1(prompt.encode("utf-8")).hexdigest() in _PHRASINGS:
                continue
            before = len(_PHRASINGS)
            phrase_question(node, lang)
            generated += len(_PHRASINGS) - before
    return generated


def _normalize_punct(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", s)).strip()


def _heuristic_normalize(node: dict, raw_text: str) -> str | None:
    low = _normalize_punct(raw_text)
    options = node.get("options", [])

    # Match against every language's label, not just the active one: a patient
    # may answer with a word from either language.
    candidates_by_option = [
        (opt["value"], [opt["value"], opt.get("label", "")]
         + [v for k, v in opt.items() if k.startswith("label_") and v])
        for opt in options
    ]

    # Exact match first. Clicking an option sends its value verbatim, so the
    # common path resolves here without ever reaching the model, and a short
    # answer can no longer be swallowed by a longer label that contains it.
    for value, candidates in candidates_by_option:
        if any(c and _normalize_punct(c) == low for c in candidates):
            return value

    for value, candidates in candidates_by_option:
        if any(c and _normalize_punct(c) in low for c in candidates):
            return value

    if node.get("answerType") == "yes_no":
        words = set(re.findall(r"[a-zàâçéèêëîïôûùüÿñæœ]+", low))
        has_yes, has_no = bool(words & _YES_WORDS), bool(words & _NO_WORDS)
        if has_yes and not has_no:
            return next((o["value"] for o in options if o["value"] == "yes"), None)
        if has_no and not has_yes:
            return next((o["value"] for o in options if o["value"] == "no"), None)
    return None


_NORMALIZE_PROMPT = {
    "fr": (
        "Un patient répond à une question de dépistage cognitif. Fais correspondre sa réponse à "
        "EXACTEMENT une des valeurs autorisées ci-dessous, ou réponds UNCLEAR si sa réponse ne "
        "correspond clairement à aucune.\n"
        "Question posée : {intent}\n"
        "Valeurs autorisées :\n{labelled}\n"
        'Réponse du patient : "{answer}"\n'
        "Réponds avec un seul mot parmi : {allowed}, UNCLEAR. Rien d'autre."
    ),
    "en": (
        "A patient is answering a cognitive screening question. Map their answer to EXACTLY one "
        "of the allowed values below, or reply UNCLEAR if it clearly matches none of them.\n"
        "Question asked: {intent}\n"
        "Allowed values:\n{labelled}\n"
        'Patient answer: "{answer}"\n'
        "Reply with a single word among: {allowed}, UNCLEAR. Nothing else."
    ),
}


def normalize_answer(node: dict, raw_text: str, lang: str = DEFAULT_LANG) -> str | None:
    hit = _heuristic_normalize(node, raw_text)
    if hit is not None:
        return hit

    options = node.get("options", [])
    allowed = [o["value"] for o in options]
    labelled = "\n".join(f'- {o["value"]}: "{localized(o, "label", lang)}"' for o in options)
    template = _NORMALIZE_PROMPT.get(lang, _NORMALIZE_PROMPT[DEFAULT_LANG])
    prompt = template.format(
        intent=localized(node, "intent", lang), labelled=labelled,
        answer=raw_text, allowed=", ".join(allowed),
    )
    text = _ollama_generate(prompt, _NORMALIZE_NUM_PREDICT)
    if not text:
        return None
    candidate = text.strip().strip('"').strip(".").lower()
    for value in allowed:
        if candidate == value.lower():
            return value
    return None
