import functools
import logging

from app.config import RERANKER_MODEL

logger = logging.getLogger(__name__)


@functools.lru_cache(maxsize=1)
def _get_cross_encoder():
    from sentence_transformers import CrossEncoder

    model = CrossEncoder(RERANKER_MODEL)
    logger.info("Loaded cross-encoder reranker (%s)", RERANKER_MODEL)
    return model


def rerank(query: str, candidates: list, text_of, top_k: int, min_score: float | None = None) -> list:
    if not candidates:
        return []
    try:
        model = _get_cross_encoder()
        pairs = [(query, text_of(c)) for c in candidates]
        scores = model.predict(pairs)
        ranked = sorted(zip(candidates, (float(s) for s in scores)), key=lambda x: x[1], reverse=True)
        if min_score is not None:
            filtered = [cs for cs in ranked if cs[1] >= min_score]
            ranked = filtered or ranked[:1]
        return ranked[:top_k]
    except Exception as e:
        logger.warning("Reranker unavailable (%s), keeping bi-encoder order", e)
        return [(c, None) for c in candidates[:top_k]]
