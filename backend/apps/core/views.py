"""
Core views — system-level endpoints including liveness and readiness health checks.
"""
import logging
import time
from datetime import datetime, timezone

from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.responses import success_response

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    GET /api/v1/health/

    Liveness probe. Indicates that the web process is running and able
    to accept incoming HTTP connections.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request: Request) -> Response:
        payload = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "service": "Patient Risk Level Prediction API",
            "services": {
                "database": "online",
                "cache": "online",
            },
        }
        return success_response(data=payload)


class HealthReadinessView(APIView):
    """
    GET /api/v1/health/ready/

    Readiness probe. Verifies that all critical backing dependencies
    (PostgreSQL database and Redis cache/channel layer) are operational.
    Returns HTTP 200 if ready, or HTTP 503 if any required service is down.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request: Request) -> Response:
        checks: dict = {}
        all_ready = True

        # 1. PostgreSQL Check
        db_start = time.monotonic()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            db_latency_ms = round((time.monotonic() - db_start) * 1000, 2)
            checks["database"] = {
                "status": "ok",
                "engine": "PostgreSQL",
                "latency_ms": db_latency_ms,
            }
        except Exception as exc:
            logger.error("Readiness check — Database failure: %s", exc)
            all_ready = False
            checks["database"] = {
                "status": "error",
                "error": str(exc),
            }

        # 2. Redis Check
        redis_start = time.monotonic()
        try:
            import redis

            redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
            r = redis.from_url(redis_url, socket_timeout=3)
            r.ping()
            redis_latency_ms = round((time.monotonic() - redis_start) * 1000, 2)
            checks["redis"] = {
                "status": "ok",
                "latency_ms": redis_latency_ms,
            }
        except Exception as exc:
            logger.error("Readiness check — Redis failure: %s", exc)
            all_ready = False
            checks["redis"] = {
                "status": "error",
                "error": str(exc),
            }

        overall_status = "ready" if all_ready else "not_ready"
        http_status = status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE

        response_data = {
            "status": overall_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dependencies": checks,
        }

        return Response(
            {"success": all_ready, "data": response_data},
            status=http_status,
        )


class MetricsView(APIView):
    """
    GET /api/v1/health/metrics/

    Production telemetry exposing API latency, ML inference latency, error rates,
    WebSocket connections, and Celery task performance.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request: Request) -> Response:
        from apps.core.metrics import metrics
        return success_response(data=metrics.get_summary())


class DatabaseHealthView(APIView):
    """GET /api/v1/health/db/ — Dedicated PostgreSQL health probe."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request: Request) -> Response:
        start = time.monotonic()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            latency = round((time.monotonic() - start) * 1000, 2)
            return success_response(data={"database": "healthy", "latency_ms": latency})
        except Exception as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class RedisHealthView(APIView):
    """GET /api/v1/health/redis/ — Dedicated Redis broker & cache probe."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request: Request) -> Response:
        start = time.monotonic()
        try:
            import redis
            redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
            r = redis.from_url(redis_url, socket_timeout=3)
            r.ping()
            latency = round((time.monotonic() - start) * 1000, 2)
            return success_response(data={"redis": "healthy", "latency_ms": latency})
        except Exception as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class CeleryHealthView(APIView):
    """GET /api/v1/health/celery/ — Dedicated Celery worker health probe."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request: Request) -> Response:
        from apps.core.metrics import metrics
        summary = metrics.get_summary()
        return success_response(data={"celery": "operational", "stats": summary["celery"]})

