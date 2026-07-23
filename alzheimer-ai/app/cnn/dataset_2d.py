import logging
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch.utils.data import Dataset

from app.config import (
    CHECKPOINTS_DIR,
    CLASSES_2D,
    DATASET_2D_DIR,
    IMAGE_SIZE_2D,
    NEAR_DUP_THRESHOLD,
)

logger = logging.getLogger(__name__)

_THUMB = 32


def list_images() -> tuple[list[Path], np.ndarray]:
    paths: list[Path] = []
    labels: list[int] = []
    for ci, cls in enumerate(CLASSES_2D):
        cls_paths = sorted((DATASET_2D_DIR / cls).glob("*.jpg"))
        if not cls_paths:
            raise FileNotFoundError(f"No images found in {DATASET_2D_DIR / cls}")
        paths += cls_paths
        labels += [ci] * len(cls_paths)
    return paths, np.array(labels)


def _thumbnail_matrix(paths: list[Path]) -> np.ndarray:
    out = np.empty((len(paths), _THUMB * _THUMB), dtype=np.float32)
    for i, p in enumerate(paths):
        a = np.asarray(Image.open(p).convert("L").resize((_THUMB, _THUMB)), dtype=np.float32).ravel()
        a = (a - a.mean()) / (a.std() + 1e-6)
        out[i] = a / np.linalg.norm(a)
        if (i + 1) % 10000 == 0:
            logger.info("  thumbnails %d/%d", i + 1, len(paths))
    return out


def _connected_components(X: np.ndarray, threshold: float, block: int = 1000) -> np.ndarray:
    n = len(X)
    parent = np.arange(n)

    def find(a: int) -> int:
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[max(ra, rb)] = min(ra, rb)

    for s in range(0, n, block):
        sims = X[s:s + block] @ X.T
        for i in range(sims.shape[0]):
            gi = s + i
            for j in np.nonzero(sims[i] > threshold)[0]:
                if j != gi:
                    union(gi, int(j))
        if s % 10000 == 0:
            logger.info("  clustering %d/%d", s, n)

    return np.array([find(i) for i in range(n)])


def get_clusters(paths: list[Path], threshold: float = None) -> np.ndarray:
    threshold = threshold if threshold is not None else NEAR_DUP_THRESHOLD
    cache = CHECKPOINTS_DIR / f"clusters_2d_thr{threshold}.npz"

    if cache.exists():
        data = np.load(cache, allow_pickle=True)
        if len(data["clusters"]) == len(paths):
            logger.info("Loaded cached near-duplicate clusters -> %s (%d clusters)",
                        cache, len(np.unique(data["clusters"])))
            return data["clusters"]
        logger.info("Cluster cache size mismatch, recomputing")

    logger.info("Computing near-duplicate clusters over %d images (thr=%.2f)...", len(paths), threshold)
    X = _thumbnail_matrix(paths)
    clusters = _connected_components(X, threshold)
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(cache, clusters=clusters)
    logger.info("Clustered %d images -> %d clusters (%.1fx reduction), cached -> %s",
                len(paths), len(np.unique(clusters)), len(paths) / len(np.unique(clusters)), cache)
    return clusters


def grouped_split(labels: np.ndarray, clusters: np.ndarray, *, val_frac=0.15, test_frac=0.15,
                  seed=42) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    uniq = np.unique(clusters)

    cluster_label = {}
    for c in uniq:
        members = labels[clusters == c]
        cluster_label[c] = np.bincount(members).argmax()

    train_c, val_c, test_c = [], [], []
    for ci in range(len(CLASSES_2D)):
        cs = np.array([c for c in uniq if cluster_label[c] == ci])
        rng.shuffle(cs)
        n_test = int(round(test_frac * len(cs)))
        n_val = int(round(val_frac * len(cs)))
        test_c += list(cs[:n_test])
        val_c += list(cs[n_test:n_test + n_val])
        train_c += list(cs[n_test + n_val:])

    def idx_of(cluster_ids):
        mask = np.isin(clusters, np.array(cluster_ids))
        return np.nonzero(mask)[0]

    tr, va, te = idx_of(train_c), idx_of(val_c), idx_of(test_c)
    assert not (set(clusters[tr]) & set(clusters[te])), "cluster leaked between train and test"
    assert not (set(clusters[tr]) & set(clusters[va])), "cluster leaked between train and val"
    logger.info("Grouped split -> train=%d val=%d test=%d images (%d/%d/%d clusters)",
                len(tr), len(va), len(te), len(train_c), len(val_c), len(test_c))
    return tr, va, te


def random_split(labels: np.ndarray, *, val_frac=0.15, test_frac=0.15, seed=42):
    rng = np.random.default_rng(seed)
    tr, va, te = [], [], []
    for ci in range(len(CLASSES_2D)):
        idx = np.nonzero(labels == ci)[0]
        rng.shuffle(idx)
        n_test = int(round(test_frac * len(idx)))
        n_val = int(round(val_frac * len(idx)))
        te += list(idx[:n_test])
        va += list(idx[n_test:n_test + n_val])
        tr += list(idx[n_test + n_val:])
    return np.array(tr), np.array(va), np.array(te)


def build_image_cache(paths: list[Path]) -> torch.Tensor:
    cache = CHECKPOINTS_DIR / f"images_2d_{IMAGE_SIZE_2D}.pt"
    if cache.exists():
        logger.info("Loading cached decoded images -> %s", cache)
        X = torch.load(cache)
        if len(X) == len(paths):
            return X
        logger.info("Image cache size mismatch, rebuilding")

    logger.info("Decoding %d images to %dx%d uint8...", len(paths), IMAGE_SIZE_2D, IMAGE_SIZE_2D)
    X = torch.empty((len(paths), IMAGE_SIZE_2D, IMAGE_SIZE_2D), dtype=torch.uint8)
    for i, p in enumerate(paths):
        im = Image.open(p).convert("L").resize((IMAGE_SIZE_2D, IMAGE_SIZE_2D), Image.BILINEAR)
        X[i] = torch.from_numpy(np.asarray(im, dtype=np.uint8))
        if (i + 1) % 10000 == 0:
            logger.info("  decoded %d/%d", i + 1, len(paths))
    cache.parent.mkdir(parents=True, exist_ok=True)
    torch.save(X, cache)
    logger.info("Cached decoded images -> %s", cache)
    return X


class Alzheimer2DDataset(Dataset):
    IMAGENET_MEAN = 0.449
    IMAGENET_STD = 0.226

    def __init__(self, images: torch.Tensor, labels: np.ndarray, indices: np.ndarray, augment: bool):
        self.images = images
        self.labels = torch.from_numpy(labels).long()
        self.indices = indices
        self.augment = augment

    def __len__(self):
        return len(self.indices)

    def _augment(self, x: torch.Tensor) -> torch.Tensor:
        if torch.rand(1).item() < 0.5:
            x = torch.flip(x, dims=(-1,))
        if torch.rand(1).item() < 0.5:
            angle = (torch.rand(1).item() * 2 - 1) * 10.0
            x = _rotate(x, angle)
        return x

    def __getitem__(self, i):
        gi = self.indices[i]
        x = self.images[gi].float().div_(255.0).unsqueeze(0)
        if self.augment:
            x = self._augment(x)
        x = (x - self.IMAGENET_MEAN) / self.IMAGENET_STD
        return x.expand(3, -1, -1).contiguous(), self.labels[gi]


def _rotate(x: torch.Tensor, angle_deg: float) -> torch.Tensor:
    import math

    import torch.nn.functional as F

    a = math.radians(angle_deg)
    theta = torch.tensor([[math.cos(a), -math.sin(a), 0.0],
                          [math.sin(a), math.cos(a), 0.0]], dtype=x.dtype).unsqueeze(0)
    xb = x.unsqueeze(0)
    grid = F.affine_grid(theta, xb.shape, align_corners=False)
    return F.grid_sample(xb, grid, mode="bilinear", padding_mode="zeros", align_corners=False).squeeze(0)
