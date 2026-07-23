import logging
from dataclasses import dataclass

from app.rag import pdf_extract
from app.rag.chunking import chunk_text
from app.rag.embeddings import get_embedding_model
from app.rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)


@dataclass
class IndexResult:
    doc_id: str
    chunk_count: int
    char_count: int


def index_document(doc_id: str, pdf_bytes: bytes, metadata: dict) -> IndexResult:
    text = pdf_extract.extract_text(pdf_bytes)
    chunks = chunk_text(text)
    if not chunks:
        logger.info("Document %s produced no chunks (empty/again-only PDF?)", doc_id)
        get_vector_store().delete(doc_id)
        return IndexResult(doc_id=doc_id, chunk_count=0, char_count=len(text))

    vectors = get_embedding_model().embed_batch(chunks)
    stored = {**metadata, "doc_id": doc_id}
    count = get_vector_store().add(doc_id, chunks, vectors, stored)
    logger.info("Indexed document %s: %d chunks from %d chars", doc_id, count, len(text))
    return IndexResult(doc_id=doc_id, chunk_count=count, char_count=len(text))


def delete_document(doc_id: str) -> int:
    removed = get_vector_store().delete(doc_id)
    logger.info("Deleted %d chunks for document %s", removed, doc_id)
    return removed
