from fastapi import FastAPI

from app.config import ensure_runtime_dirs
from app.routers import knowledge, mri, questionnaire, rag

ensure_runtime_dirs()

app = FastAPI(title="Alzheimer AI Service")

app.include_router(mri.router)
app.include_router(knowledge.router)
app.include_router(rag.router)
app.include_router(questionnaire.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "alzheimer-ai"}