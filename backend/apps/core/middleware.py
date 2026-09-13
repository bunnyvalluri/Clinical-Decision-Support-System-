"""
Audit-log middleware.

Automatically records inbound API request metadata for security and
compliance purposes. Heavy write operations (full request/response bodies)
are intentionally excluded to protect patient PII.
"""
import logging
import time
from typing import Callable

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)


class AuditLogMiddleware:
    """
    Lightweight middleware that logs API request metadata.

    Logs: method, path, status code, response time, user, IP.
    Does NOT log request or response bodies to protect patient data.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        start = time.monotonic()
        response = self.get_response(request)
        elapsed_ms = int((time.monotonic() - start) * 1000)

        # Only log API requests
        if request.path.startswith("/api/"):
            user = getattr(request, "user", None)
            from apps.core.metrics import metrics
            metrics.record_request(elapsed_ms, response.status_code)

            logger.info(
                "API %s %s -> %d [%dms] user=%s ip=%s",
                request.method,
                request.path,
                response.status_code,
                elapsed_ms,
                getattr(user, "id", "anonymous"),
                _get_client_ip(request),
            )
        return response


def _get_client_ip(request: HttpRequest) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")
