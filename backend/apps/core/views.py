"""
Core views — system-level endpoints.

Views here are intentionally minimal; all business logic lives in
the service layer, not in views.
"""
import logging

from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.responses import success_response

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    GET /api/v1/health/

    Public endpoint used by Docker health checks, load balancers, and
    monitoring systems to verify the application is running correctly.

    Returns database and cache connectivity status.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request: Request) -> Response:
        health: dict = {
            "status": "healthy",
            "version": "1.0.0",
            "services": {},
        }

        # Check database
        try:
            connection.ensure_connection()
            health["services"]["database"] = "ok"
        except Exception as exc:
            logger.error("Health check — database unreachable: %s", exc)
            health["services"]["database"] = "error"
            health["status"] = "degraded"

        # Check Redis / channel layer
        try:
            from channels.layers import get_channel_layer  # noqa: PLC0415
            from asgiref.sync import async_to_sync  # noqa: PLC0415

            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.send)(
                    "health-check",
                    {"type": "health.check"},
                )
            health["services"]["redis"] = "ok"
        except Exception as exc:
            logger.warning("Health check — Redis unreachable: %s", exc)
            health["services"]["redis"] = "error"
            health["status"] = "degraded"

        return success_response(data=health)
