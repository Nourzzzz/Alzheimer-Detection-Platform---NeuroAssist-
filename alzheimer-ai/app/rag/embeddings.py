import hashlib
import logging
import math
import re
from typing import Protocol

from app.config import (
    RAG_EMBEDDING_DIM,
    RAG_USE_SENTENCE_TRANSFORMERS,
    SENTENCE_TRANSFORMER_MODEL,
)

logger = logging.getLogger(__name__)

_TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")


class EmbeddingModel(Protocol):
    dim: int

    def embed(self, text: str) -> list[float]: ...

    def embed_batch(self, texts: list[str]) -> list[list[float]]: ...


class PlaceholderEmbedding:
    def __init__(self, dim: int = RAG_EMBEDDING_DIM):
        self.dim = dim

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        for tok in _TOKEN_RE.findall((text or "").lower()):
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            vec[h % self.dim] += 1.0
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 1e-12:
            vec = [v / norm for v in vec]
        return vec

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(t) for t in texts]


class SentenceTransformerEmbedding:
    def __init__(self, model_name: str = SENTENCE_TRANSFORMER_MODEL):
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model_name)
        self.dim = self._model.get_sentence_embedding_dimension()
        self._name = model_name

    def embed(self, text: str) -> list[float]:
        vec = self._model.encode(text or "", normalize_embeddings=True)
        return vec.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        vecs = self._model.encode(texts, normalize_embeddings=True)
        return vecs.tolist()


_model: EmbeddingModel | None = None


def get_embedding_model() -> EmbeddingModel:
    global _model
    if _model is None:
        if RAG_USE_SENTENCE_TRANSFORMERS:
            try:
                _model = SentenceTransformerEmbedding()
                logger.info("Using SentenceTransformerEmbedding (%s, dim=%d)",
                            _model._name, _model.dim)
                return _model
            except Exception as e:
                logger.warning("sentence-transformers unavailable (%s), falling back "
                               "to PlaceholderEmbedding", e)
        _model = PlaceholderEmbedding()
        logger.info("Using %s (dim=%d)", type(_model).__name__, _model.dim)
    return _model
