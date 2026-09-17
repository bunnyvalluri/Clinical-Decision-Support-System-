"""
Standardized exceptions for Meilisearch search platform.
Ensures zero stack trace or credential leakage.
"""


class SearchException(Exception):
    """Base exception for all search operations."""
    def __init__(self, message: str, code: str = "SEARCH_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class SearchServiceUnavailableException(SearchException):
    """Raised when Meilisearch cluster is down or unreachable."""
    def __init__(self, message: str = "Search service is temporarily unavailable."):
        super().__init__(message, code="SERVICE_UNAVAILABLE")


class SearchUnauthorizedException(SearchException):
    """Raised when user role attempts to access an unauthorized index or document."""
    def __init__(self, message: str = "You do not have permission to search this index."):
        super().__init__(message, code="SEARCH_UNAUTHORIZED")


class FilterInjectionException(SearchException):
    """Raised when invalid or malicious filter parameters are detected."""
    def __init__(self, message: str = "Invalid or unpermitted search filter provided."):
        super().__init__(message, code="INVALID_FILTER")


class IndexNotFoundException(SearchException):
    """Raised when the requested index does not exist."""
    def __init__(self, index_name: str):
        super().__init__(f"Search index '{index_name}' does not exist.", code="INDEX_NOT_FOUND")
        self.index_name = index_name


class RateLimitExceededException(SearchException):
    """Raised when query frequency exceeds security limits."""
    def __init__(self, message: str = "Search rate limit exceeded. Please try again shortly."):
        super().__init__(message, code="RATE_LIMIT_EXCEEDED")
