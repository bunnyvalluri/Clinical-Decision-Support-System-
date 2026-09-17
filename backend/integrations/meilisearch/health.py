"""
Search Health and Cluster Diagnostics Service.
Provides comprehensive observability into Meilisearch cluster state,
index statistics, task queue depth, and service health.
"""
from typing import Any, Dict
from .client import get_meilisearch_client
from .settings import MEILISEARCH_VERSION, ALL_INDEXES


class SearchHealthService:
    """Collects real-time diagnostic health metrics."""

    @classmethod
    def get_health_status(cls) -> Dict[str, Any]:
        """Compile health diagnostics for IT Admin and readiness probes."""
        client = get_meilisearch_client()
        is_up = client.is_available()

        if not is_up:
            return {
                "status": "UNAVAILABLE",
                "engine": "meilisearch",
                "version": MEILISEARCH_VERSION,
                "reachable": False,
                "database_size_bytes": 0,
                "indexes_count": 0,
                "active_indexes": [],
                "tasks_queued": 0,
                "fallback_mode": "POSTGRESQL_DEGRADED_READY",
            }

        stats = client.get_stats()
        version_info = client.get_version()
        tasks = client.get_tasks(limit=10)

        # Count pending tasks
        pending_tasks = sum(1 for t in tasks if isinstance(t, dict) and t.get("status") in ("enqueued", "processing"))

        indexes_stats = stats.get("indexes", {})
        active_indexes = list(indexes_stats.keys())

        return {
            "status": "HEALTHY",
            "engine": "meilisearch",
            "version": version_info.get("pkgVersion", MEILISEARCH_VERSION),
            "reachable": True,
            "database_size_bytes": stats.get("databaseSize", 0),
            "indexes_count": len(active_indexes),
            "active_indexes": active_indexes,
            "tasks_queued": pending_tasks,
            "fallback_mode": "STANDBY",
        }
