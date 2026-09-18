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
        from integrations.observability import CorrelationContext, MetricsService

        inbound_req_id = request.META.get("HTTP_X_REQUEST_ID")
        inbound_corr_id = request.META.get("HTTP_X_CORRELATION_ID")
        user = getattr(request, "user", None)
        user_id = str(getattr(user, "id", "")) if getattr(user, "is_authenticated", False) else None

        req_id, corr_id = CorrelationContext.set_request_context(
            request_id=inbound_req_id,
            correlation_id=inbound_corr_id,
            user_id=user_id,
        )

        start = time.monotonic()
        try:
            response = self.get_response(request)
        finally:
            elapsed_ms = round((time.monotonic() - start) * 1000, 2)

        # Inject tracing headers into response
        response["X-Request-ID"] = req_id
        response["X-Correlation-ID"] = corr_id

        # Only log API requests
        if request.path.startswith("/api/"):
            from apps.core.metrics import metrics
            metrics.record_request(elapsed_ms, response.status_code)
            MetricsService().record_http_request(
                method=request.method,
                path=request.path,
                status_code=response.status_code,
                duration_ms=elapsed_ms,
            )

            logger.info(
                "API %s %s -> %d [%sms] user=%s ip=%s [corr=%s]",
                request.method,
                request.path,
                response.status_code,
                elapsed_ms,
                getattr(user, "id", "anonymous"),
                _get_client_ip(request),
                corr_id,
            )
        CorrelationContext.clear()
        return response


def _get_client_ip(request: HttpRequest) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")
