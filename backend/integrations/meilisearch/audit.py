"""
Search Audit Service.
Records immutable audit logs of clinical queries with automated query redaction
to prevent PHI retention in search analytics logs.
"""
import hashlib
import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Patterns matching sensitive identifiers
MRN_PATTERN = re.compile(r'\b(MRN[-_]?[0-9a-zA-Z]+|[0-9]{6,10})\b', re.IGNORECASE)
DOB_PATTERN = re.compile(r'\b\d{4}[-/]\d{2}[-/]\d{2}\b')
PHONE_PATTERN = re.compile(r'\b\+?[0-9]{10,14}\b')


def redact_search_query(query: str) -> str:
    """
    Hash or redact sensitive identifiers in search queries.
    Prevents storage of PHI in search telemetry.
    """
    if not query:
        return ""

    sanitized = query
    # Check if query contains MRN or phone or DOB
    if MRN_PATTERN.search(sanitized) or DOB_PATTERN.search(sanitized) or PHONE_PATTERN.search(sanitized):
        # Create irreversible pseudonymized hash representation
        query_hash = hashlib.sha256(sanitized.strip().lower().encode("utf-8")).hexdigest()[:12]
        return f"[REDACTED_IDENTIFIER_HASH:{query_hash}]"

    return sanitized[:100]


def record_search_audit(
    user: Any,
    query: str,
    index_name: str,
    result_count: int,
    latency_ms: int,
    search_mode: str = "meilisearch",
    correlation_id: str = "",
) -> None:
    """Record an audit trail event for a completed search execution."""
    safe_query = redact_search_query(query)
    user_id = getattr(user, "id", None) if user and user.is_authenticated else None
    role = getattr(user, "role", "ANONYMOUS")
    if hasattr(role, "value"):
        role = role.value

    try:
        from apps.search.models import SearchAuditEvent
        SearchAuditEvent.objects.create(
            user=user if user and user.is_authenticated else None,
            user_id_ref=user_id,
            role=str(role),
            index_name=index_name,
            redacted_query=safe_query,
            result_count=result_count,
            latency_ms=latency_ms,
            search_mode=search_mode,
            correlation_id=correlation_id,
        )
    except Exception as exc:
        # Fallback to structured file logger
        logger.info(
            "SearchAudit user_id=%s role=%s index=%s results=%s latency=%sms mode=%s",
            user_id,
            role,
            index_name,
            result_count,
            latency_ms,
            search_mode,
        )
