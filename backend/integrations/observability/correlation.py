"""
Distributed Correlation & Request Context Management.
Maintains contextual request_id and correlation_id across async and sync thread boundaries.
"""

import contextvars
import re
import uuid
from typing import Optional

# Thread-safe async context storage
_request_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)
_correlation_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("correlation_id", default=None)
_user_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)

UUID_PATTERN = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")


class CorrelationContext:
    """
    Manages correlation and request identifiers for distributed tracing and structured logs.
    """

    @staticmethod
    def sanitize_or_generate_id(inbound_id: Optional[str]) -> str:
        """Validate format (UUID or safe token, 10-64 chars) or generate fresh UUID4."""
        if inbound_id and isinstance(inbound_id, str):
            clean = inbound_id.strip()
            # Must be valid UUID or alphanumeric with hyphen, max 64 chars
            if UUID_PATTERN.match(clean) or (clean.replace("-", "").isalnum() and 8 <= len(clean) <= 64):
                return clean
        return str(uuid.uuid4())

    @classmethod
    def set_request_context(
        cls,
        request_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> tuple[str, str]:
        """Establish execution context for current request or worker task."""
        rid = cls.sanitize_or_generate_id(request_id)
        cid = cls.sanitize_or_generate_id(correlation_id or rid)
        _request_id_ctx.set(rid)
        _correlation_id_ctx.set(cid)
        if user_id:
            _user_id_ctx.set(str(user_id))
        return rid, cid

    @classmethod
    def get_request_id(cls) -> str:
        val = _request_id_ctx.get()
        return val or str(uuid.uuid4())

    @classmethod
    def get_correlation_id(cls) -> str:
        val = _correlation_id_ctx.get()
        return val or cls.get_request_id()

    @classmethod
    def get_user_id(cls) -> Optional[str]:
        return _user_id_ctx.get()

    @classmethod
    def clear(cls):
        _request_id_ctx.set(None)
        _correlation_id_ctx.set(None)
        _user_id_ctx.set(None)
