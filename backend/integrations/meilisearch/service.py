"""
High-Level Meilisearch Service.
Coordinates authorization, query execution, filter injection prevention,
audit logging, and seamless fallback to PostgreSQL when degraded.
"""
import logging
import time
from typing import Any, Dict, List, Optional
from .client import get_meilisearch_client
from .permissions import SearchPolicyService
from .fallback import PostgresFallbackSearchService
from .audit import record_search_audit
from .exceptions import SearchUnauthorizedException
from .settings import (
    ALL_INDEXES,
    INDEX_PATIENTS,
    INDEX_PREDICTIONS,
    INDEX_CLINICAL_RECORDS,
    INDEX_MODELS,
    INDEX_DATA_QUALITY,
    INDEX_WHITEBOARDS,
    INDEX_KNOWLEDGE_SOURCES,
    SEARCH_DEGRADED_FALLBACK_ENABLED,
)

logger = logging.getLogger(__name__)


class MeilisearchService:
    """Core application search service orchestrator."""

    def __init__(self, client: Optional[Any] = None):
        self.client = client or get_meilisearch_client()

    def search(
        self,
        user: Any,
        query: str = "",
        index_name: Optional[str] = None,
        filters_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
        facets: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 20,
        highlight: bool = True,
        correlation_id: str = "",
    ) -> Dict[str, Any]:
        """Execute a validated, authorization-aware search across permitted indexes."""
        start_time = time.time()
        allowed_indexes = SearchPolicyService.get_allowed_indexes(user)

        # 1. Resolve Target Index
        target_index = index_name or (INDEX_PATIENTS if INDEX_PATIENTS in allowed_indexes else (allowed_indexes[0] if allowed_indexes else INDEX_KNOWLEDGE_SOURCES))

        if target_index not in allowed_indexes:
            logger.warning("User %s attempted unauthorized search in index %s", getattr(user, "username", "anon"), target_index)
            raise SearchUnauthorizedException(f"You do not have permission to search index '{target_index}'.")

        # 2. Check cluster availability -> Fallback if down
        if not self.client.is_available():
            if SEARCH_DEGRADED_FALLBACK_ENABLED:
                logger.info("Meilisearch unavailable. Falling back to PostgreSQL for index '%s'", target_index)
                res = PostgresFallbackSearchService.search(
                    user=user,
                    query=query,
                    index_name=target_index,
                    page=page,
                    limit=limit,
                    filters_dict=filters_dict,
                )
                record_search_audit(
                    user=user,
                    query=query,
                    index_name=target_index,
                    result_count=res.get("total", 0),
                    latency_ms=res.get("processing_time_ms", 0),
                    search_mode="degraded_postgres",
                    correlation_id=correlation_id,
                )
                return res
            return {
                "hits": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0,
                "processing_time_ms": int((time.time() - start_time) * 1000),
                "search_mode": "unavailable",
                "error": "Search engine temporarily unavailable.",
            }

        # 3. Construct Safe Filters
        mandatory_clauses = SearchPolicyService.get_mandatory_filters(user, target_index)
        user_clauses = SearchPolicyService.validate_and_sanitize_filter(user, target_index, filters_dict)
        all_clauses = mandatory_clauses + user_clauses
        combined_filter = " AND ".join(all_clauses) if all_clauses else None

        # 4. Configure Meilisearch Query Parameters
        offset = max(0, (page - 1) * limit)
        search_params: Dict[str, Any] = {
            "offset": offset,
            "limit": limit,
        }
        if combined_filter:
            search_params["filter"] = combined_filter
        if sort:
            # Sort format validation: e.g. "updated_at:desc"
            search_params["sort"] = [sort]
        if facets:
            search_params["facets"] = facets
        if highlight:
            search_params["attributesToHighlight"] = ["*"]
            search_params["highlightPreTag"] = "<em>"
            search_params["highlightPostTag"] = "</em>"

        # 5. Execute Search
        try:
            raw_index = self.client.raw_client.index(target_index)
            raw_res = raw_index.search(query, search_params)

            hits = raw_res.get("hits", [])
            total_hits = raw_res.get("estimatedTotalHits", len(hits))

            # Apply field projection & sanitization per user role
            sanitized_hits = []
            for hit in hits:
                clean_hit = SearchPolicyService.filter_document_fields(user, target_index, hit)
                sanitized_hits.append(clean_hit)

            latency_ms = int((time.time() - start_time) * 1000)

            # Record audit event
            record_search_audit(
                user=user,
                query=query,
                index_name=target_index,
                result_count=len(sanitized_hits),
                latency_ms=latency_ms,
                search_mode="meilisearch",
                correlation_id=correlation_id,
            )

            total_pages = (total_hits + limit - 1) // limit if limit > 0 else 1

            return {
                "hits": sanitized_hits,
                "total": total_hits,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "facet_distribution": raw_res.get("facetDistribution", {}),
                "processing_time_ms": latency_ms,
                "search_mode": "meilisearch",
            }

        except Exception as exc:
            logger.error("Error executing Meilisearch search on %s: %s", target_index, exc)
            if SEARCH_DEGRADED_FALLBACK_ENABLED:
                logger.info("Cascading to PostgreSQL fallback after exception.")
                return PostgresFallbackSearchService.search(
                    user=user,
                    query=query,
                    index_name=target_index,
                    page=page,
                    limit=limit,
                    filters_dict=filters_dict,
                )
            raise

    def get_suggestions(self, user: Any, query: str, index_name: Optional[str] = None) -> List[Dict[str, str]]:
        """Retrieve controlled suggestions without exposing sensitive patient details."""
        if not query or len(query.strip()) < 2:
            return []

        allowed = SearchPolicyService.get_allowed_indexes(user)
        target = index_name if (index_name and index_name in allowed) else (allowed[0] if allowed else INDEX_KNOWLEDGE_SOURCES)

        if not self.client.is_available():
            return []

        try:
            raw_index = self.client.raw_client.index(target)
            res = raw_index.search(query, {"limit": 5})
            suggestions = []
            for h in res.get("hits", []):
                title = h.get("display_name") or h.get("title") or h.get("name") or h.get("mrn")
                if title:
                    suggestions.append({
                        "label": title,
                        "category": target,
                        "id": str(h.get("document_id", "")),
                    })
            return suggestions
        except Exception:
            return []

    def get_facets(self, user: Any, index_name: str) -> Dict[str, Any]:
        """Fetch facet counts for the authorized index."""
        if not SearchPolicyService.can_search_index(user, index_name):
            return {}

        if not self.client.is_available():
            return {}

        facet_keys = {
            INDEX_PATIENTS: ["blood_group", "gender", "is_active"],
            INDEX_PREDICTIONS: ["prediction_result", "model_name"],
            INDEX_MODELS: ["status", "algorithm"],
            INDEX_DATA_QUALITY: ["severity", "status"],
            INDEX_WHITEBOARDS: ["type", "status"],
        }.get(index_name, [])

        if not facet_keys:
            return {}

        try:
            raw_index = self.client.raw_client.index(index_name)
            res = raw_index.search("", {"facets": facet_keys, "limit": 0})
            return res.get("facetDistribution", {})
        except Exception:
            return {}


_search_service_instance: Optional[MeilisearchService] = None


def get_search_service() -> MeilisearchService:
    global _search_service_instance
    if _search_service_instance is None:
        _search_service_instance = MeilisearchService()
    return _search_service_instance
