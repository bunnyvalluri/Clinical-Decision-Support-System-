"""
Standardised API response helpers.

All API views should use these helpers to produce consistent JSON envelopes:

    Success:
        {
            "success": true,
            "data": <payload>,
            "message": "Optional message.",
            "meta": { "pagination": {...} }   # optional
        }

    Error:
        Handled by apps.core.exceptions.custom_exception_handler
"""
from typing import Any

from rest_framework import status
from rest_framework.response import Response


def success_response(
    data: Any = None,
    message: str = "",
    status_code: int = status.HTTP_200_OK,
    meta: dict[str, Any] | None = None,
) -> Response:
    """Return a standardised 2xx success response."""
    payload: dict[str, Any] = {"success": True, "data": data}
    if message:
        payload["message"] = message
    if meta:
        payload["meta"] = meta
    return Response(payload, status=status_code)


def created_response(
    data: Any = None,
    message: str = "Resource created successfully.",
) -> Response:
    """Return a standardised 201 Created response."""
    return success_response(data=data, message=message, status_code=status.HTTP_201_CREATED)


def no_content_response() -> Response:
    """Return a standardised 204 No Content response."""
    return Response(status=status.HTTP_204_NO_CONTENT)


def paginated_response(
    data: Any,
    pagination_meta: dict[str, Any],
    message: str = "",
) -> Response:
    """Return a standardised paginated list response."""
    return success_response(
        data=data,
        message=message,
        meta={"pagination": pagination_meta},
    )
