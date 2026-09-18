"""
Kaggle Dataset Metadata Service.
Gathers exhaustive provenance, file structure, author, licensing, and documentation metadata.
"""
import logging
from typing import Optional

from integrations.kaggle.client import KaggleClient
from integrations.kaggle.schemas import KaggleMetadataSnapshot

logger = logging.getLogger("integrations.kaggle.metadata_service")


class KaggleMetadataService:
    """Collects, standardizes, and caches Kaggle dataset metadata snapshots."""

    def __init__(self, client: Optional[KaggleClient] = None) -> None:
        self.client = client or KaggleClient()

    def fetch_metadata(self, owner: str, slug: str) -> KaggleMetadataSnapshot:
        """
        Inspect dataset metadata snapshot from Kaggle.
        """
        logger.info("Fetching Kaggle metadata for %s/%s", owner, slug)
        snapshot = self.client.get_dataset_metadata(owner=owner, slug=slug)
        return snapshot
