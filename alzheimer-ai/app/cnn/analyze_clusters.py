import logging

import numpy as np

from app.cnn.dataset_2d import _connected_components, _thumbnail_matrix, list_images

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

THRESHOLDS = (0.99, 0.98, 0.97, 0.95, 0.92, 0.90)


def main() -> None:
    paths, labels = list_images()
    logger.info("Building thumbnails for %d images...", len(paths))
    X = _thumbnail_matrix(paths)

    logger.info("=" * 72)
    logger.info("%-8s %10s %10s %12s %14s", "thr", "clusters", "reduction", "largest", "singletons")
    rows = []
    for thr in THRESHOLDS:
        clusters = _connected_components(X, thr)
        uniq, counts = np.unique(clusters, return_counts=True)
        n_clusters = len(uniq)
        singletons = int((counts == 1).sum())
        rows.append((thr, n_clusters, len(paths) / n_clusters, int(counts.max()), singletons))
        logger.info("%-8.2f %10d %9.1fx %12d %14d", thr, n_clusters, len(paths) / n_clusters,
                    int(counts.max()), singletons)

    logger.info("=" * 72)
    base = next(r for r in rows if r[0] == 0.98)[1]
    strict = rows[-1][1]
    logger.info("Cluster count at 0.98 = %d, at %.2f = %d (%.0f%% of the 0.98 count).",
                base, THRESHOLDS[-1], strict, 100 * strict / base)
    logger.info("If that percentage is low, the 0.98 grouped split leaves residual leakage "
                "and its accuracy is optimistic; re-run training at the stricter threshold.")


if __name__ == "__main__":
    main()
