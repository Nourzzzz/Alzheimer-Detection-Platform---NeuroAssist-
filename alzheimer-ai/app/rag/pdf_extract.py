import io
import logging

from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except Exception as e:
        logger.warning("Could not parse PDF (%s); treating as empty text", e)
        return ""

    parts = []
    for i, page in enumerate(reader.pages):
        try:
            parts.append(page.extract_text() or "")
        except Exception as e:
            logger.warning("Failed to extract text from page %d (%s), skipping", i, e)
    return "\n".join(parts).strip()
