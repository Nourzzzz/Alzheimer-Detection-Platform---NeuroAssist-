import argparse
import logging

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader

from app.config import CHECKPOINTS_DIR, CLASSES_2D, CNN_2D_BACKBONE, CNN_2D_CHECKPOINT_PATH
from app.cnn.dataset_2d import (
    Alzheimer2DDataset,
    build_image_cache,
    get_clusters,
    grouped_split,
    list_images,
    random_split,
)
from app.cnn.model import build_model_2d

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _metrics(model, loader, device, n_classes: int) -> dict:
    model.eval()
    cm = np.zeros((n_classes, n_classes), dtype=int)
    with torch.no_grad():
        for xb, yb in loader:
            preds = model(xb.to(device)).argmax(dim=1).cpu()
            for t, p in zip(yb.tolist(), preds.tolist()):
                cm[t, p] += 1

    total = cm.sum()
    acc = np.trace(cm) / total if total else 0.0
    per_class = []
    for i in range(n_classes):
        tp = cm[i, i]
        prec = tp / cm[:, i].sum() if cm[:, i].sum() else 0.0
        rec = tp / cm[i].sum() if cm[i].sum() else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        per_class.append({"precision": prec, "recall": rec, "f1": f1, "support": int(cm[i].sum())})
    macro_f1 = float(np.mean([c["f1"] for c in per_class]))
    return {"accuracy": float(acc), "macro_f1": macro_f1, "per_class": per_class, "confusion": cm}


def _log_metrics(name: str, m: dict) -> None:
    logger.info("%s: accuracy=%.4f macro_F1=%.4f", name, m["accuracy"], m["macro_f1"])
    logger.info("  %-18s %9s %7s %7s %8s", "class", "precision", "recall", "F1", "support")
    for cls, c in zip(CLASSES_2D, m["per_class"]):
        logger.info("  %-18s %9.3f %7.3f %7.3f %8d", cls, c["precision"], c["recall"], c["f1"], c["support"])
    logger.info("  confusion (rows=true, cols=pred):")
    for cls, row in zip(CLASSES_2D, m["confusion"]):
        logger.info("    %-18s %s", cls, row.tolist())


def train(split: str = "grouped", epochs: int = 12, batch_size: int = 64, lr: float = 3e-4,
          weight_decay: float = 1e-4, backbone: str = None, patience: int = 4,
          checkpoint_path=None, seed: int = 42, max_batches_per_epoch: int | None = None):
    torch.manual_seed(seed)
    backbone = backbone or CNN_2D_BACKBONE
    checkpoint_path = checkpoint_path or CNN_2D_CHECKPOINT_PATH

    paths, labels = list_images()
    images = build_image_cache(paths)

    if split == "grouped":
        clusters = get_clusters(paths)
        tr_idx, va_idx, te_idx = grouped_split(labels, clusters, seed=seed)
    elif split == "random":
        logger.warning("Using the RANDOM split: near-duplicates straddle train/test, so the "
                       "resulting score is inflated by leakage and is NOT a real accuracy.")
        tr_idx, va_idx, te_idx = random_split(labels, seed=seed)
    else:
        raise ValueError(f"Unknown split {split!r}, expected 'grouped' or 'random'")

    train_loader = DataLoader(Alzheimer2DDataset(images, labels, tr_idx, augment=True),
                              batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(Alzheimer2DDataset(images, labels, va_idx, augment=False),
                            batch_size=batch_size, num_workers=0)
    test_loader = DataLoader(Alzheimer2DDataset(images, labels, te_idx, augment=False),
                             batch_size=batch_size, num_workers=0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model_2d(pretrained=True, backbone=backbone).to(device)
    logger.info("Training 2D | split=%s backbone=%s device=%s epochs=%d bs=%d lr=%.1e",
                split, backbone, device, epochs, batch_size, lr)

    counts = np.bincount(labels[tr_idx], minlength=len(CLASSES_2D)).astype(np.float64)
    weights = torch.tensor((counts.sum() / (len(counts) * np.maximum(counts, 1))),
                           dtype=torch.float32, device=device)
    logger.info("Train class counts=%s -> weights=%s", counts.astype(int).tolist(),
                [round(w, 3) for w in weights.tolist()])

    criterion = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val, epochs_without_improvement = 0.0, 0
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss, n_seen = 0.0, 0
        for i, (xb, yb) in enumerate(train_loader):
            if max_batches_per_epoch is not None and i >= max_batches_per_epoch:
                break
            xb, yb = xb.to(device), yb.to(device)
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * xb.size(0)
            n_seen += xb.size(0)
            if i % 50 == 0:
                logger.info("  epoch %d batch %d/%d loss=%.4f", epoch, i, len(train_loader), loss.item())
        scheduler.step()

        val = _metrics(model, val_loader, device, len(CLASSES_2D))
        logger.info("Epoch %d/%d - train_loss=%.4f val_acc=%.4f val_macroF1=%.4f",
                    epoch, epochs, total_loss / max(n_seen, 1), val["accuracy"], val["macro_f1"])

        if val["macro_f1"] > best_val:
            best_val = val["macro_f1"]
            epochs_without_improvement = 0
            torch.save({"model_state": model.state_dict(), "classes": CLASSES_2D,
                        "backbone": backbone, "split": split}, checkpoint_path)
            logger.info("Saved new best checkpoint (val_macroF1=%.4f) -> %s", best_val, checkpoint_path)
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= patience:
                logger.info("No val improvement for %d epochs, stopping early.", patience)
                break

    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state"])
    logger.info("=" * 70)
    logger.info("FINAL TEST RESULTS (split=%s, backbone=%s)", split, backbone)
    test = _metrics(model, test_loader, device, len(CLASSES_2D))
    _log_metrics("TEST", test)
    if split == "random":
        logger.warning("Reminder: this is the LEAKY split - the number above is inflated.")
    return {"val_macro_f1": best_val, "test": test}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--split", choices=["grouped", "random"], default="grouped")
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--backbone", choices=["resnet18", "resnet50"], default=None)
    parser.add_argument("--patience", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--checkpoint-name", default=None)
    parser.add_argument("--max-batches-per-epoch", type=int, default=None)
    args = parser.parse_args()
    ckpt = CHECKPOINTS_DIR / args.checkpoint_name if args.checkpoint_name else None
    train(split=args.split, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr,
          weight_decay=args.weight_decay, backbone=args.backbone, patience=args.patience,
          seed=args.seed, checkpoint_path=ckpt, max_batches_per_epoch=args.max_batches_per_epoch)
