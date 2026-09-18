"""
Distributed Tracing Service for HealthNova AI.
Tracks execution spans across HTTP requests, Django ORM, Celery workers, and ML inference.
Adheres strictly to OpenTelemetry conceptual semantics without storing PHI.
"""

from contextlib import contextmanager
import logging
import time
from typing import Any, Dict, Generator, Optional
from django.conf import settings

from .correlation import CorrelationContext

logger = logging.getLogger(__name__)


class TracingService:
    """
    Coordinates distributed tracing contexts and span recording.
    """

    def __init__(self, service_name: str = "healthnova-backend"):
        self.service_name = service_name
        self.environment = getattr(settings, "ENVIRONMENT", "production")

    @contextmanager
    def start_span(
        self,
        operation_name: str,
        tags: Optional[Dict[str, Any]] = None,
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Context manager that tracks operation span latency and outcome.
        """
        start_time = time.perf_counter()
        span_context: Dict[str, Any] = {
            "operation": operation_name,
            "service": self.service_name,
            "environment": self.environment,
            "correlation_id": CorrelationContext.get_correlation_id(),
            "request_id": CorrelationContext.get_request_id(),
            "tags": tags or {},
            "status": "OK",
            "error": None,
        }

        try:
            yield span_context
        except Exception as exc:
            span_context["status"] = "ERROR"
            span_context["error"] = str(exc)
            raise
        finally:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            span_context["duration_ms"] = duration_ms
            if span_context["status"] == "ERROR":
                logger.warning(
                    f"Span '{operation_name}' failed after {duration_ms}ms [corr={span_context['correlation_id']}]: {span_context['error']}"
                )
            else:
                logger.debug(
                    f"Span '{operation_name}' completed in {duration_ms}ms [corr={span_context['correlation_id']}]"
                )
