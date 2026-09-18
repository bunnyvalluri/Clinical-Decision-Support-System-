"""
Normalized exceptions for Google Jules integration.
Shields internal callers and UI from raw HTTP or upstream stack traces.
"""
from typing import Optional, Dict, Any


class JulesBaseError(Exception):
    """Base exception for all Jules integration errors."""
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "status_code": self.status_code,
            "details": self.details,
        }


class JulesAuthenticationError(JulesBaseError):
    """Raised when JULES_API_KEY is invalid or missing (401)."""
    def __init__(self, message: str = "Invalid or missing Jules API credentials.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)


class JulesAuthorizationError(JulesBaseError):
    """Raised when access to a Jules resource is forbidden (403)."""
    def __init__(self, message: str = "Permission denied for the requested Jules resource.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)


class JulesRateLimitError(JulesBaseError):
    """Raised when Jules API quota or rate limit is reached (429)."""
    def __init__(self, message: str = "Jules API rate limit exceeded.", retry_after: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        if retry_after:
            d["retry_after"] = retry_after
        super().__init__(message, status_code=429, details=d)


class JulesNotFoundError(JulesBaseError):
    """Raised when a requested source, session, or activity is not found (404)."""
    def __init__(self, message: str = "Jules resource not found.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)


class JulesValidationError(JulesBaseError):
    """Raised when input to Jules fails schema or semantic validation."""
    def __init__(self, message: str = "Invalid request payload for Jules.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)


class JulesTimeoutError(JulesBaseError):
    """Raised when a Jules API request times out."""
    def __init__(self, message: str = "Jules API request timed out.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=504, details=details)


class JulesUnavailableError(JulesBaseError):
    """Raised when Jules API service returns 5xx or is temporarily unreachable."""
    def __init__(self, message: str = "Jules API service is temporarily unavailable.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)


class JulesCircuitBreakerOpenError(JulesBaseError):
    """Raised when requests are blocked because the circuit breaker is OPEN."""
    def __init__(self, message: str = "Jules circuit breaker is OPEN. Automation requests temporarily halted.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)


class JulesPolicyViolationError(JulesBaseError):
    """Raised when a requested remediation action violates engineering safety policies."""
    def __init__(self, message: str = "Action denied by Jules safety policy.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)


class JulesUnexpectedError(JulesBaseError):
    """Raised when an unhandled or unexpected error occurs during Jules processing."""
    def __init__(self, message: str = "An unexpected error occurred during Jules automation.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)
