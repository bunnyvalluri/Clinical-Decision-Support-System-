"""
Domain exceptions for Kaggle dataset integration.
All exceptions are categorized and inherit from KaggleIntegrationError.
"""


class KaggleIntegrationError(Exception):
    """Base exception for all Kaggle integration failures."""

    def __init__(self, message: str, code: str = "KAGGLE_ERROR", details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class KaggleAuthenticationError(KaggleIntegrationError):
    """Raised when Kaggle credentials are missing, malformed, or rejected by upstream API."""

    def __init__(self, message: str = "Kaggle authentication failed or credentials not configured", details: dict | None = None):
        super().__init__(message, code="KAGGLE_AUTH_ERROR", details=details)


class KaggleRateLimitError(KaggleIntegrationError):
    """Raised when Kaggle API rate limits or concurrency throttles are exceeded."""

    def __init__(self, message: str = "Kaggle API rate limit exceeded", details: dict | None = None):
        super().__init__(message, code="KAGGLE_RATE_LIMIT", details=details)


class KaggleDatasetNotFoundError(KaggleIntegrationError):
    """Raised when a requested Kaggle dataset or version slug does not exist."""

    def __init__(self, message: str = "Kaggle dataset not found", details: dict | None = None):
        super().__init__(message, code="KAGGLE_DATASET_NOT_FOUND", details=details)


class KaggleDownloadError(KaggleIntegrationError):
    """Raised when downloading, decompressing, or verifying archive integrity fails."""

    def __init__(self, message: str = "Failed to download or extract Kaggle dataset archive", details: dict | None = None):
        super().__init__(message, code="KAGGLE_DOWNLOAD_ERROR", details=details)


class KaggleSecurityError(KaggleIntegrationError):
    """Raised when security violations are detected (e.g. zip bomb, path traversal, CSV formula injection)."""

    def __init__(self, message: str = "Dataset violated security policies", details: dict | None = None):
        super().__init__(message, code="KAGGLE_SECURITY_ERROR", details=details)


class KaggleValidationError(KaggleIntegrationError):
    """Raised when a candidate dataset fails quality, schema, or clinical gate validation."""

    def __init__(self, message: str = "Dataset validation failed", details: dict | None = None):
        super().__init__(message, code="KAGGLE_VALIDATION_ERROR", details=details)
