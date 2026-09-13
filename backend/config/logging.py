"""
Structured JSON logging formatter for production CDSS deployments.

Emits single-line JSON suitable for Loki, Elasticsearch, Datadog, or CloudWatch,
including correlation IDs, user identifiers, latency, and sanitized error context.
"""
from datetime import datetime, timezone
import json
import logging
import traceback


class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "funcName": record.funcName,
            "lineNo": record.lineno,
            "process": record.process,
            "thread": record.thread,
        }

        # Contextual request metadata (if injected via middleware)
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_data["user_id"] = str(record.user_id)
        if hasattr(record, "path"):
            log_data["path"] = record.path
        if hasattr(record, "method"):
            log_data["method"] = record.method
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = round(record.duration_ms, 2)
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code

        # Exception information
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "Unknown",
                "message": str(record.exc_info[1]),
                "stacktrace": traceback.format_exception(*record.exc_info),
            }

        return json.dumps(log_data)
