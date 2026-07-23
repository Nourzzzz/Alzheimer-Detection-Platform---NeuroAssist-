import logging
import time
from pathlib import Path

import httpx

from app.config import CHECKPOINTS_DIR

logger = logging.getLogger(__name__)

TORCHVISION_DIR = CHECKPOINTS_DIR / "torchvision"
CHUNK_SIZE = 25 * 1024 * 1024
MAX_RETRIES = 8
RETRY_SLEEP_S = 3


def _download_chunked(url: str, dest: Path) -> None:
    with httpx.Client(follow_redirects=True) as client:
        head = client.head(url, timeout=30)
        head.raise_for_status()
        total = int(head.headers["content-length"])
        pos = dest.stat().st_size if dest.exists() else 0
        if pos >= total:
            return
        logger.info("Chunked download %s: resuming at %.1f%%", dest.name, 100 * pos / total)

        with open(dest, "ab") as f:
            while pos < total:
                end = min(pos + CHUNK_SIZE, total) - 1
                for attempt in range(1, MAX_RETRIES + 1):
                    try:
                        r = client.get(url, headers={"Range": f"bytes={pos}-{end}"}, timeout=120)
                        if r.status_code not in (200, 206):
                            raise RuntimeError(f"unexpected status {r.status_code}")
                        f.write(r.content)
                        f.flush()
                        pos = end + 1
                        break
                    except Exception as e:
                        if attempt == MAX_RETRIES:
                            raise
                        logger.warning("chunk [%d-%d] attempt %d/%d failed (%s), retrying",
                                        pos, end, attempt, MAX_RETRIES, e)
                        time.sleep(RETRY_SLEEP_S)
        logger.info("Chunked download %s complete", dest.name)


def get_torchvision_weights(weights_enum):
    import torch

    url = weights_enum.url
    filename = url.rsplit("/", 1)[-1]
    TORCHVISION_DIR.mkdir(parents=True, exist_ok=True)
    local = TORCHVISION_DIR / filename

    if local.exists() and local.stat().st_size > 0:
        return torch.load(local, map_location="cpu")

    try:
        return torch.hub.load_state_dict_from_url(url, check_hash=False, progress=False)
    except Exception as e:
        logger.warning("torch.hub download failed for %s (%s); falling back to chunked download",
                        filename, e)

    _download_chunked(url, local)
    return torch.load(local, map_location="cpu")
