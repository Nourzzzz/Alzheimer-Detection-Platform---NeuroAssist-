import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = Path(os.getenv("AI_DATA_DIR", BASE_DIR / "data"))
CHECKPOINTS_DIR = DATA_DIR / "checkpoints"

DATASET_2D_DIR = Path(os.getenv("DATASET_2D_DIR", DATA_DIR / "combined_images"))
CLASSES_2D = ["NonDemented", "VeryMildDemented", "MildDemented", "ModerateDemented"]
IMAGE_SIZE_2D = int(os.getenv("IMAGE_SIZE_2D", "176"))
NEAR_DUP_THRESHOLD = float(os.getenv("NEAR_DUP_THRESHOLD", "0.98"))
CNN_2D_BACKBONE = os.getenv("CNN_2D_BACKBONE", "resnet18")
CNN_2D_CHECKPOINT_PATH = Path(os.getenv(
    "CNN_2D_CHECKPOINT_PATH", CHECKPOINTS_DIR / "cnn_alz2d_best.pt"))
IMAGE_EXTENSIONS_2D = (".jpg", ".jpeg", ".png")
CLASS_MAP_2D_TO_3D = {
    "NonDemented": "CN",
    "VeryMildDemented": "MCI",
    "MildDemented": "AD",
    "ModerateDemented": "AD",
}

VECTOR_STORE_DIR = Path(os.getenv("VECTOR_STORE_DIR", DATA_DIR / "vector_store"))
GUIDELINES_CORPUS_DIR = Path(os.getenv("GUIDELINES_CORPUS_DIR", DATA_DIR / "guidelines_corpus"))

RAG_CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))
RAG_EMBEDDING_DIM = int(os.getenv("RAG_EMBEDDING_DIM", "384"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "4"))

RAG_RETRIEVE_K = int(os.getenv("RAG_RETRIEVE_K", "20"))
RAG_USE_RERANKER = os.getenv("RAG_USE_RERANKER", "true").lower() == "true"
RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
RAG_RERANK_MIN_SCORE = float(os.getenv("RAG_RERANK_MIN_SCORE", "0"))

RAG_USE_SENTENCE_TRANSFORMERS = os.getenv("RAG_USE_SENTENCE_TRANSFORMERS", "true").lower() == "true"
SENTENCE_TRANSFORMER_MODEL = os.getenv("SENTENCE_TRANSFORMER_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

RAG_USE_CLINICALBERT = os.getenv("RAG_USE_CLINICALBERT", "true").lower() == "true"
CLINICALBERT_MODEL = os.getenv("CLINICALBERT_MODEL", "d4data/biomedical-ner-all")
CLINICALBERT_MIN_SCORE = float(os.getenv("CLINICALBERT_MIN_SCORE", "0.5"))

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
RAG_USE_OLLAMA = os.getenv("RAG_USE_OLLAMA", "true").lower() == "true"
OLLAMA_TIMEOUT_S = float(os.getenv("OLLAMA_TIMEOUT_S", "600"))
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "600"))
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "30m")

CLASSES = ["CN", "MCI", "AD"]


def ensure_runtime_dirs() -> None:
    for d in (VECTOR_STORE_DIR, GUIDELINES_CORPUS_DIR):
        d.mkdir(parents=True, exist_ok=True)
