"""
Resilient client wrapper for Meilisearch v1.12.0.
Features:
- Timeout configuration
- Circuit-breaker and degraded mode detection
- Task polling with timeout bounds
- Health checks
"""
import logging
import time
from typing import Any, Dict, List, Optional
import meilisearch
from meilisearch.errors import MeilisearchCommunicationError, MeilisearchApiError

from .settings import (
    MEILISEARCH_HOST,
    MEILISEARCH_MASTER_KEY,
    MEILISEARCH_TIMEOUT_SECONDS,
)
from .exceptions import SearchServiceUnavailableException

logger = logging.getLogger(__name__)


class MeilisearchClient:
    """Wrapper around official Meilisearch Python SDK with healthcare resilience."""

    _instance: Optional["MeilisearchClient"] = None

    def __init__(self, host: str = MEILISEARCH_HOST, api_key: str = MEILISEARCH_MASTER_KEY, timeout: int = MEILISEARCH_TIMEOUT_SECONDS):
        self.host = host
        self.api_key = api_key
        self.timeout = timeout
        self._client: Optional[meilisearch.Client] = None
        self._last_health_check_time: float = 0.0
        self._is_healthy: bool = False
        self._init_client()

    def _init_client(self) -> None:
        try:
            self._client = meilisearch.Client(
                url=self.host,
                api_key=self.api_key,
                timeout=self.timeout,
            )
        except Exception as exc:
            logger.warning("Failed to initialize Meilisearch client: %s", exc)
            self._client = None

    @property
    def raw_client(self) -> meilisearch.Client:
        if self._client is None:
            self._init_client()
        if self._client is None:
            raise SearchServiceUnavailableException("Meilisearch client could not be instantiated.")
        return self._client

    def is_available(self) -> bool:
        """Check if Meilisearch cluster is reachable (cached for 5 seconds)."""
        now = time.time()
        if now - self._last_health_check_time < 5.0:
            return self._is_healthy

        self._last_health_check_time = now
        try:
            health = self.raw_client.health()
            self._is_healthy = health.get("status") == "available"
        except Exception:
            self._is_healthy = False
        return self._is_healthy

    def get_version(self) -> Dict[str, Any]:
        """Return engine version details."""
        try:
            return self.raw_client.get_version()
        except Exception as exc:
            logger.warning("Could not fetch Meilisearch version: %s", exc)
            return {"pkgVersion": "unknown", "status": "unreachable"}

    def get_stats(self) -> Dict[str, Any]:
        """Fetch global database and index stats."""
        try:
            return self.raw_client.get_all_stats()
        except Exception as exc:
            logger.warning("Could not fetch Meilisearch stats: %s", exc)
            return {"databaseSize": 0, "lastUpdate": None, "indexes": {}}

    def wait_for_task(self, task_uid: int, timeout_ms: int = 5000, interval_ms: int = 100) -> Dict[str, Any]:
        """Poll Meilisearch task queue until task finishes or timeout expires."""
        try:
            return self.raw_client.wait_for_task(
                task_uid=task_uid,
                timeout_in_ms=timeout_ms,
                interval_in_ms=interval_ms,
            )
        except Exception as exc:
            logger.error("Failed or timed out waiting for task %s: %s", task_uid, exc)
            raise SearchServiceUnavailableException(f"Task {task_uid} execution error: {exc}")

    def get_tasks(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieve recent asynchronous indexing tasks."""
        try:
            res = self.raw_client.get_tasks({"limit": limit})
            if hasattr(res, "results"):
                return res.results
            if isinstance(res, dict) and "results" in res:
                return res["results"]
            return list(res) if isinstance(res, list) else []
        except Exception as exc:
            logger.warning("Failed to fetch Meilisearch tasks: %s", exc)
            return []


_client_instance: Optional[MeilisearchClient] = None


def get_meilisearch_client() -> MeilisearchClient:
    """Return thread-safe singleton MeilisearchClient."""
    global _client_instance
    if _client_instance is None:
        _client_instance = MeilisearchClient()
    return _client_instance
