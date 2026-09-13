"""Shared common exception classes."""
from apps.core.exceptions import (
    ApplicationError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    RateLimitExceededError,
    ValidationError,
    custom_exception_handler,
)

__all__ = [
    "ApplicationError",
    "NotFoundError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ConflictError",
    "RateLimitExceededError",
    "custom_exception_handler",
]
