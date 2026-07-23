import logging

from fastapi import APIRouter, HTTPException

from app.rag import rag_service
from app.schemas import RagAssessRequest, RagAssessResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/assess", response_model=RagAssessResponse)
def assess(req: RagAssessRequest):
    try:
        result = rag_service.generate_assessment(req.model_dump())
    except Exception as e:
        logger.exception("RAG assessment failed")
        raise HTTPException(status_code=500, detail=f"RAG assessment failed: {e}")
    return RagAssessResponse(**result)
