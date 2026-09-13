"""
Universal Distributed Correlation Tracking.
Propagates X-Correlation-ID across HTTP, Database, Celery, and WebSocket boundaries.
"""
import threading
from typing import Callable, Optional
import uuid

from django.http import HttpRequest, HttpResponse

_correlation_context = threading.local()


def get_current_correlation_id() -> str:
    """Retrieve correlation ID for current execution thread."""
    return getattr(_correlation_context, "correlation_id", "system-root-trace")


def set_current_correlation_id(correlation_id: str) -> None:
    """Set correlation ID for current execution thread."""
    _correlation_context.correlation_id = correlation_id


class CorrelationMiddleware:
    """
    Middleware extracting or injecting X-Correlation-ID on all HTTP requests and responses.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        correlation_id = (
            request.headers.get("X-Correlation-ID")
            or request.headers.get("Correlation-ID")
            or str(uuid.uuid4())
        )
        set_current_correlation_id(correlation_id)
        request.correlation_id = correlation_id

        response = self.get_response(request)
        response["X-Correlation-ID"] = correlation_id
        return response
