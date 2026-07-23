import functools
import logging
import re

from app.config import CLINICALBERT_MIN_SCORE, CLINICALBERT_MODEL, RAG_USE_CLINICALBERT

logger = logging.getLogger(__name__)

_BUCKETS = ("symptoms", "treatments", "conditions", "history")

_FALLBACK_LEXICONS = {
    "symptoms": [
        "memory loss", "forgetfulness", "confusion", "disorientation", "aphasia",
        "apraxia", "agnosia", "mood swings", "depression", "anxiety", "apathy",
        "wandering", "insomnia", "hallucination", "agitation", "difficulty concentrating",
    ],
    "treatments": [
        "donepezil", "rivastigmine", "galantamine", "memantine", "aricept",
        "cognitive therapy", "physiotherapy", "occupational therapy",
        "antidepressant", "antipsychotic", "vitamin e", "mediterranean diet",
    ],
    "conditions": [
        "alzheimer", "dementia", "mild cognitive impairment", "parkinson",
        "vascular dementia", "lewy body", "frontotemporal",
    ],
    "history": [
        "hypertension", "diabetes", "stroke", "hyperlipidemia", "atrial fibrillation",
        "myocardial infarction", "head injury", "smoking", "family history",
    ],
}

_GROUP_TO_BUCKET = {
    "Sign_symptom": "symptoms",
    "Medication": "treatments",
    "Therapeutic_procedure": "treatments",
    "Disease_disorder": "conditions",
    "History": "history",
    "Family_history": "history",
}

_NEGATION_CUES = [
    "no", "not", "without", "denies", "denied", "deny", "negative for",
    "no signs of", "no evidence of", "absent", "ruled out", "free of", "never",
]
_NEG_RE = re.compile(r"\b(" + "|".join(re.escape(c) for c in _NEGATION_CUES) + r")\b", re.IGNORECASE)
_SENTENCE_BOUNDARY = ".;\n"


def _keyword_find(text: str, lexicon: list[str]) -> list[str]:
    low = (text or "").lower()
    return [term for term in lexicon if re.search(r"\b" + re.escape(term) + r"\b", low)]


def _keyword_find_neg_aware(text: str, lexicon: list[str]) -> list[str]:
    low = (text or "").lower()
    found = []
    for term in lexicon:
        for m in re.finditer(r"\b" + re.escape(term) + r"\b", low):
            if not _is_negated(text, m.start()):
                found.append(term)
                break
    return found


def _dedupe(items: list[str]) -> list[str]:
    seen, out = set(), []
    for it in items:
        if it and it not in seen:
            seen.add(it)
            out.append(it)
    return [it for it in out if not any(it != o and re.search(r"\b" + re.escape(it) + r"\b", o) for o in out)]


def _is_negated(text: str, entity_start: int) -> bool:
    boundary = max(text.rfind(c, 0, entity_start) for c in _SENTENCE_BOUNDARY)
    window = text[boundary + 1:entity_start]
    return bool(_NEG_RE.search(window))


class _BiomedicalNerExtractor:
    def __init__(self, model_name: str):
        from transformers import pipeline

        self._ner = pipeline("ner", model=model_name, aggregation_strategy="first")
        logger.info("Loaded biomedical NER extractor (%s)", model_name)

    def extract(self, text: str, min_score: float) -> dict:
        text = text or ""
        if not text.strip():
            return {b: [] for b in _BUCKETS}

        buckets: dict[str, list[str]] = {b: [] for b in _BUCKETS}
        for ent in self._ner(text):
            if float(ent["score"]) < min_score:
                continue
            bucket = _GROUP_TO_BUCKET.get(ent["entity_group"])
            if bucket is None:
                continue
            word = ent["word"].replace("##", "").strip().lower().strip(" .,;:")
            if len(word) < 3:
                continue
            if _is_negated(text, ent["start"]):
                continue
            buckets[bucket].append(word)

        for bucket in _BUCKETS:
            buckets[bucket].extend(_keyword_find_neg_aware(text, _FALLBACK_LEXICONS[bucket]))

        out = {b: _dedupe(buckets[b]) for b in _BUCKETS}
        conditions = set(out["conditions"])
        out["history"] = [h for h in out["history"] if h not in conditions]
        return out


@functools.lru_cache(maxsize=1)
def _get_extractor() -> _BiomedicalNerExtractor:
    return _BiomedicalNerExtractor(CLINICALBERT_MODEL)


def extract_clinical(text: str) -> dict:
    if RAG_USE_CLINICALBERT:
        try:
            return _get_extractor().extract(text, CLINICALBERT_MIN_SCORE)
        except Exception as e:
            logger.warning("Biomedical NER unavailable (%s), falling back to keyword matching", e)
    return {b: _keyword_find(text, _FALLBACK_LEXICONS[b]) for b in _BUCKETS}
