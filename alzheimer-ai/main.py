import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import ensure_runtime_dirs
from app.routers import knowledge, mri, questionnaire, rag

logger = logging.getLogger(__name__)

ensure_runtime_dirs()


def _warm_questionnaire() -> None:
    try:
        generated = questionnaire.warm_question_cache()
        logger.info("Questionnaire phrasing cache ready (%s newly generated)", generated)
    except Exception:
        logger.exception("Questionnaire phrasing warm-up failed; falling back to on-demand phrasing")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Off the event loop: the first patient of the day should not pay for the
    # model warm-up, but the service must accept requests immediately.
    threading.Thread(target=_warm_questionnaire, name="questionnaire-warmup", daemon=True).start()
    yield


app = FastAPI(title="Alzheimer AI Service", lifespan=lifespan)

app.include_router(mri.router)
app.include_router(knowledge.router)
app.include_router(rag.router)
app.include_router(questionnaire.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "alzheimer-ai"}
