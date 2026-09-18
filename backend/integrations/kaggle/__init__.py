"""
Kaggle dataset integration package.
Provides discovery, metadata retrieval, security validation, download, and versioning.
"""
from integrations.kaggle.authentication import KaggleAuthService
from integrations.kaggle.client import KaggleClient
from integrations.kaggle.dataset_client import KaggleDatasetService
from integrations.kaggle.download_client import KaggleDownloadService
from integrations.kaggle.metadata_client import KaggleMetadataService
from integrations.kaggle.version_client import KaggleVersionService
from integrations.kaggle.validators import KaggleSecurityValidator
from integrations.kaggle.exceptions import (
    KaggleAuthenticationError,
    KaggleDatasetNotFoundError,
    KaggleDownloadError,
    KaggleIntegrationError,
    KaggleRateLimitError,
    KaggleSecurityError,
    KaggleValidationError,
)

__all__ = [
    "KaggleAuthService",
    "KaggleClient",
    "KaggleDatasetService",
    "KaggleDownloadService",
    "KaggleMetadataService",
    "KaggleVersionService",
    "KaggleSecurityValidator",
    "KaggleIntegrationError",
    "KaggleAuthenticationError",
    "KaggleDatasetNotFoundError",
    "KaggleDownloadError",
    "KaggleRateLimitError",
    "KaggleSecurityError",
    "KaggleValidationError",
]
