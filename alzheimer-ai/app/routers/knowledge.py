import logging

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app.rag import indexing
from app.rag.embeddings import get_embedding_model
from app.rag.vector_store import get_vector_store
from app.schemas import IndexResponse, SearchHitModel, SearchResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/index", response_model=IndexResponse)
async def index_document(
    doc_id: str = Form(...),
    title: str = Form(""),
    category: str = Form("GUIDELINE"),
    file: UploadFile = File(...),
):
    try:
        pdf_bytes = await file.read()
        result = indexing.index_document(
            doc_id=doc_id,
            pdf_bytes=pdf_bytes,
            metadata={"title": title, "category": category, "filename": file.filename},
        )
    except Exception as e:
        logger.exception("Indexing failed for document %s", doc_id)
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}")
    return IndexResponse(
        doc_id=result.doc_id,
        chunk_count=result.chunk_count,
        char_count=result.char_count,
        indexed=result.chunk_count > 0,
    )


@router.get("/documents")
def list_documents():
    return {"documents": get_vector_store().documents()}


@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    removed = indexing.delete_document(doc_id)
    return {"doc_id": doc_id, "chunks_removed": removed}


@router.get("/search", response_model=SearchResponse)
def search(q: str = Query(..., min_length=1), k: int = 4):
    qvec = get_embedding_model().embed(q)
    hits = get_vector_store().search(qvec, k=k)
    return SearchResponse(
        query=q,
        hits=[SearchHitModel(doc_id=h.doc_id, chunk_index=h.chunk_index,
                             text=h.text[:400], score=round(h.score, 4)) for h in hits],
    )
