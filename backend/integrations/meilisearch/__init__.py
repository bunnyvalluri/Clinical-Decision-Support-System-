"""
Meilisearch v1.12.0 Integration Package for HealthNova AI (BPY-CSE-2666).
Dedicated search indexing and fast retrieval layer.
Sole authoritative source of truth: Neon PostgreSQL.
"""
from .client import MeilisearchClient, get_meilisearch_client
from .service import MeilisearchService, get_search_service

__all__ = [
    "MeilisearchClient",
    "get_meilisearch_client",
    "MeilisearchService",
    "get_search_service",
]
