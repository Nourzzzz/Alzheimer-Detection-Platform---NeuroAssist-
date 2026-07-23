import json
import logging
import threading
from dataclasses import dataclass
from pathlib import Path

from app.config import VECTOR_STORE_DIR

logger = logging.getLogger(__name__)


@dataclass
class SearchHit:
    doc_id: str
    chunk_index: int
    text: str
    score: float
    metadata: dict


def _cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


class JsonVectorStore:
    def __init__(self, path: Path | None = None):
        self._path = Path(path) if path else VECTOR_STORE_DIR / "index.json"
        self._lock = threading.Lock()
        self._records: list[dict] = []
        self._load()

    def _load(self):
        if self._path.exists():
            try:
                self._records = json.loads(self._path.read_text(encoding="utf-8"))
            except Exception as e:
                logger.warning("Could not read vector store %s (%s), starting empty", self._path, e)
                self._records = []

    def _persist(self):
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._records), encoding="utf-8")

    def add(self, doc_id: str, chunks: list[str], vectors: list[list[float]], metadata: dict) -> int:
        with self._lock:
            self._records = [r for r in self._records if r["doc_id"] != doc_id]
            for i, (text, vec) in enumerate(zip(chunks, vectors)):
                self._records.append({
                    "doc_id": doc_id,
                    "chunk_index": i,
                    "text": text,
                    "vector": vec,
                    "metadata": metadata,
                })
            self._persist()
            return len(chunks)

    def search(self, query_vector: list[float], k: int = 4) -> list[SearchHit]:
        with self._lock:
            scored = [
                SearchHit(r["doc_id"], r["chunk_index"], r["text"],
                          _cosine(query_vector, r["vector"]), r.get("metadata", {}))
                for r in self._records
            ]
        scored.sort(key=lambda h: h.score, reverse=True)
        return scored[:k]

    def delete(self, doc_id: str) -> int:
        with self._lock:
            before = len(self._records)
            self._records = [r for r in self._records if r["doc_id"] != doc_id]
            removed = before - len(self._records)
            self._persist()
            return removed

    def document_ids(self) -> list[str]:
        with self._lock:
            return sorted({r["doc_id"] for r in self._records})

    def documents(self) -> list[dict]:
        with self._lock:
            by_doc: dict[str, list[dict]] = {}
            for r in self._records:
                by_doc.setdefault(r["doc_id"], []).append(r)
        summaries = []
        for doc_id, recs in by_doc.items():
            recs.sort(key=lambda r: r["chunk_index"])
            first_vec = recs[0]["vector"]
            meta = recs[0].get("metadata", {})
            summaries.append({
                "doc_id": doc_id,
                "title": meta.get("title", ""),
                "category": meta.get("category", ""),
                "chunk_count": len(recs),
                "embedding_dim": len(first_vec),
                "vector_preview": [round(v, 4) for v in first_vec[:8]],
                "first_chunk_preview": recs[0]["text"][:160],
            })
        return sorted(summaries, key=lambda s: s["doc_id"])


_store: JsonVectorStore | None = None


def get_vector_store() -> JsonVectorStore:
    global _store
    if _store is None:
        _store = JsonVectorStore()
        logger.info("Using %s at %s", type(_store).__name__, _store._path)
    return _store
