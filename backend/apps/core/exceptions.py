"""
Custom exception classes and DRF exception handler for BPY-CSE-2666.

All application-level exceptions inherit from ApplicationError, giving us
consistent error serialization and HTTP status codes across the entire API.
"""
import logging
from typing import Any

from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Base application exception
# ---------------------------------------------------------------------------
class ApplicationError(Exception):
    """
    Root exception for all application-layer errors.

    Attributes:
        message:     Human-readable error description.
        code:        Machine-readable error code (snake_case).
        status_code: HTTP status code to return.
        details:     Optional structured extra data (e.g. field errors).
    """

    message: str = "An unexpected error occurred."
    code: str = "internal_error"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    details: dict[str, Any] | None = None

    def __init__(
        self,
        message: str | None = None,
        details: dict[str, Any] | None = None,
        status_code: int | None = None,
        code: str | None = None,
    ) -> None:
        self.message = message or self.__class__.message
        self.details = details or {}
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        super().__init__(self.message)


# ---------------------------------------------------------------------------
# Concrete exception classes
# ---------------------------------------------------------------------------
class NotFoundError(ApplicationError):
    message = "The requested resource was not found."
    code = "not_found"
    status_code = status.HTTP_404_NOT_FOUND


class ValidationError_(ApplicationError):  # noqa: N818
    message = "Validation failed."
    code = "validation_error"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY


class AuthenticationError(ApplicationError):
    message = "Authentication credentials were not provided or are invalid."
    code = "authentication_error"
    status_code = status.HTTP_401_UNAUTHORIZED


class AuthorizationError(ApplicationError):
    message = "You do not have permission to perform this action."
    code = "authorization_error"
    status_code = status.HTTP_403_FORBIDDEN


class ConflictError(ApplicationError):
    message = "A conflict occurred with the current state of the resource."
    code = "conflict_error"
    status_code = status.HTTP_409_CONFLICT


class ServiceError(ApplicationError):
    message = "A service-layer error occurred."
    code = "service_error"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class MLPredictionError(ApplicationError):
    message = "An error occurred during ML prediction."
    code = "ml_prediction_error"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class MLModelNotFoundError(ApplicationError):
    message = "No trained ML model is available for the requested operation."
    code = "ml_model_not_found"
    status_code = status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Custom DRF exception handler
# ---------------------------------------------------------------------------
def custom_exception_handler(
    exc: Exception, context: dict[str, Any]
) -> Response | None:
    """
    Global DRF exception handler.

    Formats ALL exceptions — including application-layer errors, DRF built-ins,
    and unexpected exceptions — into a consistent JSON envelope:

        {
            "success": false,
            "error": {
                "code": "error_code",
                "message": "Human-readable message.",
                "details": {}
            }
        }
    """
    request: Request = context.get("request")  # type: ignore[assignment]
    view = context.get("view")

    # Let DRF handle its own exceptions first
    response = exception_handler(exc, context)

    if isinstance(exc, ApplicationError):
        logger.warning(
            "Application error: %s [%s] — view=%s user=%s",
            exc.code,
            exc.message,
            view.__class__.__name__ if view else "unknown",
            getattr(request, "user", "anonymous"),
        )
        return Response(
            {
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
            },
            status=exc.status_code,
        )

    if isinstance(exc, Http404):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "not_found",
                    "message": str(exc) or "The requested resource was not found.",
                    "details": {},
                },
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "authentication_error",
                    "message": str(exc.detail),
                    "details": {},
                },
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if isinstance(exc, PermissionDenied):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "authorization_error",
                    "message": str(exc.detail),
                    "details": {},
                },
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if isinstance(exc, ValidationError):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "validation_error",
                    "message": "Validation failed.",
                    "details": exc.detail,
                },
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if response is not None:
        # DRF handled it but we want consistent envelope
        return Response(
            {
                "success": False,
                "error": {
                    "code": "api_error",
                    "message": str(response.data),
                    "details": {},
                },
            },
            status=response.status_code,
        )

    # Unhandled exceptions — log and return 500
    logger.exception(
        "Unhandled exception in view=%s user=%s",
        view.__class__.__name__ if view else "unknown",
        getattr(request, "user", "anonymous"),
        exc_info=exc,
    )
    return Response(
        {
            "success": False,
            "error": {
                "code": "internal_error",
                "message": "An internal server error occurred. Please contact support.",
                "details": {},
            },
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
