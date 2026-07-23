import re

from app.config import RAG_CHUNK_OVERLAP, RAG_CHUNK_SIZE

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?;:])\s+|\n{2,}")


def _split_sentences(text: str) -> list[str]:
    parts = (s.strip() for s in _SENTENCE_SPLIT.split(text))
    return [s for s in parts if s]


def _hard_wrap(sentence: str, size: int) -> list[str]:
    words = sentence.split()
    out, cur = [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > size:
            out.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}" if cur else w
    if cur:
        out.append(cur)
    return out


def chunk_text(text: str, size: int = RAG_CHUNK_SIZE, overlap: int = RAG_CHUNK_OVERLAP) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []
    if size <= 0:
        raise ValueError("chunk size must be positive")
    overlap = max(0, min(overlap, size - 1))

    sentences: list[str] = []
    for s in _split_sentences(text):
        sentences.extend(_hard_wrap(s, size) if len(s) > size else [s])

    chunks: list[str] = []
    cur: list[str] = []
    cur_len = 0
    for s in sentences:
        add = len(s) + (1 if cur else 0)
        if cur and cur_len + add > size:
            chunks.append(" ".join(cur))
            keep: list[str] = []
            keep_len = 0
            for prev in reversed(cur):
                if keep_len + len(prev) + 1 > overlap:
                    break
                keep.insert(0, prev)
                keep_len += len(prev) + 1
            cur = keep
            cur_len = sum(len(x) + 1 for x in cur)
        cur.append(s)
        cur_len += add
    if cur:
        chunks.append(" ".join(cur))
    return chunks
