"""
Tenant Token generator for scoped client-side search.
Enables secure frontend search without exposing master or administrative keys.
"""
import datetime
import logging
from typing import Any, Dict, List, Optional
from .client import get_meilisearch_client
from .settings import MEILISEARCH_MASTER_KEY
from .permissions import SearchPolicyService

logger = logging.getLogger(__name__)


def generate_scoped_tenant_token(
    user: Any,
    allowed_indexes: Optional[List[str]] = None,
    expiration_minutes: int = 15,
) -> Optional[str]:
    """
    Generate a short-lived Meilisearch Tenant Token for the authenticated user.
    Applies role boundaries directly into the token's searchRules claim.
    """
    try:
        client = get_meilisearch_client()
        raw = client.raw_client

        # 1. Determine user allowed indexes
        user_allowed = set(SearchPolicyService.get_allowed_indexes(user))
        target_indexes = [idx for idx in (allowed_indexes or list(user_allowed)) if idx in user_allowed]

        # 2. Build search rules with mandatory filters
        search_rules: Dict[str, Any] = {}
        for idx in target_indexes:
            mandatory_filters = SearchPolicyService.get_mandatory_filters(user, idx)
            filter_expr = " AND ".join(mandatory_filters) if mandatory_filters else None
            search_rules[idx] = {"filter": filter_expr} if filter_expr else {}

        # 3. Expiration timestamp
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=expiration_minutes)

        # 4. Generate token via client SDK or fall back
        if hasattr(raw, "generate_tenant_token"):
            return raw.generate_tenant_token(
                search_rules=search_rules,
                expires_at=expires_at,
            )
        return None
    except Exception as exc:
        logger.warning("Failed to generate tenant token for user %s: %s", getattr(user, "username", "anon"), exc)
        return None
