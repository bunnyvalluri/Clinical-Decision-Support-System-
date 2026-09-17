"""
Search Data Governance & Retention Service.
Enforces right-to-be-forgotten, deletion propagation, and classification policies.
"""
import logging
from typing import Any
from django.utils import timezone
from datetime import timedelta
from .client import get_meilisearch_client
from .settings import (
    INDEX_CLASSIFICATIONS,
    CLASSIFICATION_PUBLIC,
    CLASSIFICATION_INTERNAL,
    CLASSIFICATION_SENSITIVE,
    CLASSIFICATION_PHI,
    CLASSIFICATION_RESTRICTED,
)

logger = logging.getLogger(__name__)


class SearchDataGovernanceService:
    """Oversees search index retention, classification, and deletion propagation."""

    @classmethod
    def get_index_classification(cls, index_name: str) -> str:
        """Return data classification level for the index."""
        return INDEX_CLASSIFICATIONS.get(index_name, CLASSIFICATION_INTERNAL)

    @classmethod
    def propagate_deletion(cls, index_name: str, document_id: str) -> bool:
        """
        Idempotently purge a document from Meilisearch when deleted from PostgreSQL.
        """
        try:
            client = get_meilisearch_client()
            if not client.is_available():
                logger.warning("Meilisearch unavailable; deferring deletion for %s", document_id)
                return False
            idx = client.raw_client.index(index_name)
            idx.delete_document(document_id)
            logger.info("Deleted search projection '%s' from '%s'", document_id, index_name)
            return True
        except Exception as exc:
            logger.error("Failed to delete document '%s' from index '%s': %s", document_id, index_name, exc)
            return False

    @classmethod
    def purge_expired_audit_logs(cls, retention_days: int = 90) -> int:
        """Purge search audit logs older than retention period."""
        cutoff = timezone.now() - timedelta(days=retention_days)
        try:
            from apps.search.models import SearchAuditEvent
            deleted_count, _ = SearchAuditEvent.objects.filter(timestamp__lt=cutoff).delete()
            return deleted_count
        except Exception as exc:
            logger.warning("Failed to purge expired search audit logs: %s", exc)
            return 0
