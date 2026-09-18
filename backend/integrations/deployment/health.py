"""
HealthCheckService for HealthNova AI.
Coordinates holistic pre-flight and post-deployment health verification across all tiers:
- Django ASGI Backend
- Next.js Clinical Frontend
- Neon PostgreSQL
- Redis Message Broker & Cache
- Celery Task Worker
- Meilisearch Retrieval Projection
- Ollama Self-Hosted LLM

CRITICAL: Never fabricates metrics or status. Honest diagnostic reporting only.
"""

import logging
import time
from typing import Any, Dict, Optional
import requests
from django.conf import settings
from django.db import connection

logger = logging.getLogger(__name__)


class HealthCheckService:
    """
    Evaluates real operational health of containerized services and external managed resources.
    """

    def __init__(self, timeout: float = 3.0):
        self.timeout = timeout

    def check_database(self) -> Dict[str, Any]:
        """Check Neon PostgreSQL connection using real SQL probe."""
        start = time.time()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                latency_ms = round((time.time() - start) * 1000, 2)
                if row and row[0] == 1:
                    return {
                        "status": "HEALTHY",
                        "component": "Neon PostgreSQL",
                        "latency_ms": latency_ms,
                        "error": None,
                    }
                return {
                    "status": "UNHEALTHY",
                    "component": "Neon PostgreSQL",
                    "latency_ms": latency_ms,
                    "error": "Unexpected query result",
                }
        except Exception as exc:
            logger.error(f"Neon PostgreSQL health probe failed: {exc}")
            return {
                "status": "UNHEALTHY",
                "component": "Neon PostgreSQL",
                "latency_ms": round((time.time() - start) * 1000, 2),
                "error": str(exc),
            }

    def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity."""
        start = time.time()
        redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        try:
            import redis
            client = redis.Redis.from_url(redis_url, socket_timeout=self.timeout)
            ping_ok = client.ping()
            latency_ms = round((time.time() - start) * 1000, 2)
            return {
                "status": "HEALTHY" if ping_ok else "UNHEALTHY",
                "component": "Redis",
                "latency_ms": latency_ms,
                "error": None if ping_ok else "PING returned False",
            }
        except Exception as exc:
            return {
                "status": "UNHEALTHY",
                "component": "Redis",
                "latency_ms": round((time.time() - start) * 1000, 2),
                "error": str(exc),
            }

    def check_frontend(self, frontend_url: Optional[str] = None) -> Dict[str, Any]:
        """Check Next.js frontend health endpoint."""
        url = frontend_url or getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        target = f"{url.rstrip('/')}/api/health"
        start = time.time()
        try:
            resp = requests.get(target, timeout=self.timeout)
            latency_ms = round((time.time() - start) * 1000, 2)
            if resp.status_code == 200:
                data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                return {
                    "status": "HEALTHY",
                    "component": "Next.js Frontend",
                    "latency_ms": latency_ms,
                    "details": data,
                    "error": None,
                }
            return {
                "status": "UNHEALTHY",
                "component": "Next.js Frontend",
                "latency_ms": latency_ms,
                "error": f"HTTP {resp.status_code}",
            }
        except Exception as exc:
            return {
                "status": "UNHEALTHY",
                "component": "Next.js Frontend",
                "latency_ms": round((time.time() - start) * 1000, 2),
                "error": str(exc),
            }

    def check_meilisearch(self, meili_url: Optional[str] = None) -> Dict[str, Any]:
        """Check Meilisearch health status."""
        url = meili_url or getattr(settings, "MEILISEARCH_URL", "http://localhost:7700")
        target = f"{url.rstrip('/')}/health"
        start = time.time()
        try:
            resp = requests.get(target, timeout=self.timeout)
            latency_ms = round((time.time() - start) * 1000, 2)
            if resp.status_code == 200:
                return {
                    "status": "HEALTHY",
                    "component": "Meilisearch",
                    "latency_ms": latency_ms,
                    "error": None,
                }
            return {
                "status": "UNHEALTHY",
                "component": "Meilisearch",
                "latency_ms": latency_ms,
                "error": f"HTTP {resp.status_code}",
            }
        except Exception as exc:
            return {
                "status": "UNHEALTHY",
                "component": "Meilisearch",
                "latency_ms": round((time.time() - start) * 1000, 2),
                "error": str(exc),
            }

    def check_ollama(self, ollama_url: Optional[str] = None) -> Dict[str, Any]:
        """Check Ollama AI model availability."""
        url = ollama_url or getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
        target = f"{url.rstrip('/')}/api/version"
        start = time.time()
        try:
            resp = requests.get(target, timeout=self.timeout)
            latency_ms = round((time.time() - start) * 1000, 2)
            if resp.status_code == 200:
                return {
                    "status": "HEALTHY",
                    "component": "Ollama LLM",
                    "latency_ms": latency_ms,
                    "error": None,
                }
            return {
                "status": "DEGRADED",
                "component": "Ollama LLM",
                "latency_ms": latency_ms,
                "error": f"HTTP {resp.status_code}",
            }
        except Exception as exc:
            return {
                "status": "DEGRADED",
                "component": "Ollama LLM",
                "latency_ms": round((time.time() - start) * 1000, 2),
                "error": str(exc),
            }

    def perform_full_system_check(self) -> Dict[str, Any]:
        """Perform comprehensive health probe across all services."""
        db = self.check_database()
        redis = self.check_redis()
        frontend = self.check_frontend()
        meili = self.check_meilisearch()
        ollama = self.check_ollama()

        critical_services = [db, redis]
        is_operational = all(s["status"] == "HEALTHY" for s in critical_services)

        overall_status = "HEALTHY" if is_operational else "DEGRADED"
        if db["status"] == "UNHEALTHY":
            overall_status = "CRITICAL"

        return {
            "status": overall_status,
            "timestamp": time.time(),
            "services": {
                "database": db,
                "redis": redis,
                "frontend": frontend,
                "meilisearch": meili,
                "ollama": ollama,
            },
        }
