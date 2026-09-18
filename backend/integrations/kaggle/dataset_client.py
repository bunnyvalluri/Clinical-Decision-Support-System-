"""
Kaggle Dataset Discovery and Candidate Service.
Coordinates querying Kaggle dataset repository with medical domain search strategies.
"""
import logging
from typing import List, Optional

from integrations.kaggle.client import KaggleClient
from integrations.kaggle.schemas import KaggleCandidateSummary

logger = logging.getLogger("integrations.kaggle.dataset_service")

# Approved domain search terms for clinical decision support discovery
APPROVED_DISCOVERY_QUERIES = [
    "patient risk prediction",
    "healthcare risk prediction",
    "diabetes risk",
    "cardiovascular risk",
    "heart disease",
    "hypertension",
    "chronic disease",
    "clinical prediction",
    "patient outcome prediction",
    "healthcare classification",
    "medical machine learning",
    "clinical decision support",
]


class KaggleDatasetService:
    """Service layer for discovering and retrieving candidate Kaggle datasets."""

    def __init__(self, client: Optional[KaggleClient] = None) -> None:
        self.client = client or KaggleClient()

    def discover_candidates(self, search_query: str = "patient risk", page: int = 1, limit: int = 20) -> List[KaggleCandidateSummary]:
        """
        Search for candidate datasets matching a query or domain default.
        Every candidate returned is marked unapproved pending validation.
        """
        clean_query = search_query.strip() if search_query else "patient risk"
        logger.info("Discovering Kaggle datasets for query: '%s' (page %d)", clean_query, page)
        candidates = self.client.search_datasets(query=clean_query, page=page, max_results=limit)
        return candidates

    def run_multi_query_discovery(self, queries: Optional[List[str]] = None) -> List[KaggleCandidateSummary]:
        """
        Execute domain-wide discovery scan across approved healthcare search criteria.
        Deduplicates candidate repositories by owner/slug.
        """
        scan_queries = queries or APPROVED_DISCOVERY_QUERIES[:4]
        seen_refs = set()
        aggregated: List[KaggleCandidateSummary] = []

        for q in scan_queries:
            results = self.discover_candidates(search_query=q, limit=10)
            for item in results:
                ref = f"{item.kaggle_owner}/{item.kaggle_slug}"
                if ref not in seen_refs:
                    seen_refs.add(ref)
                    aggregated.append(item)

        return aggregated
