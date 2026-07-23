import os
import time

import httpx

REPO = "bartowski/Meta-Llama-3.1-8B-Instruct-GGUF"
FILENAME = "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
URL = f"https://huggingface.co/{REPO}/resolve/main/{FILENAME}"
DEST = os.path.join("data", "checkpoints", "gguf", FILENAME)
CHUNK_SIZE = 100 * 1024 * 1024
MAX_RETRIES = 6
RETRY_SLEEP_S = 5


def get_total_size(client: httpx.Client) -> int:
    r = client.head(URL, timeout=30)
    r.raise_for_status()
    return int(r.headers["content-length"])


def download() -> None:
    os.makedirs(os.path.dirname(DEST), exist_ok=True)
    with httpx.Client(follow_redirects=True) as client:
        total = get_total_size(client)
        print(f"Total size: {total / 1e9:.2f} GB", flush=True)
        pos = os.path.getsize(DEST) if os.path.exists(DEST) else 0
        print(f"Resuming from {pos / 1e9:.2f} GB ({100 * pos / total:.1f}%)", flush=True)

        with open(DEST, "ab") as f:
            while pos < total:
                end = min(pos + CHUNK_SIZE, total) - 1
                for attempt in range(1, MAX_RETRIES + 1):
                    try:
                        r = client.get(URL, headers={"Range": f"bytes={pos}-{end}"}, timeout=180)
                        if r.status_code not in (200, 206):
                            raise RuntimeError(f"unexpected status {r.status_code}")
                        f.write(r.content)
                        f.flush()
                        pos = end + 1
                        print(f"progress: {100 * pos / total:.1f}% ({pos / 1e9:.2f} / {total / 1e9:.2f} GB)", flush=True)
                        break
                    except Exception as e:
                        print(f"chunk [{pos}-{end}] attempt {attempt}/{MAX_RETRIES} failed: {e}", flush=True)
                        if attempt == MAX_RETRIES:
                            raise
                        time.sleep(RETRY_SLEEP_S)

    print("DONE: download complete", flush=True)


if __name__ == "__main__":
    download()
