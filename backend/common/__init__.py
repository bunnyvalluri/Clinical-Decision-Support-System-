"""
Common module providing base abstractions, models, responses, and permissions.
"""
from apps.core.exceptions import (
    ApplicationError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    RateLimitExceededError,
    ValidationError,
)
from apps.core.models import AllObjectsManager, BaseModel, SoftDeleteManager, SoftDeleteModel
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import (
    IsAdmin,
    IsAdminOrDoctor,
    IsAdminOrDoctorOrNurse,
    IsAnalyst,
    IsClinicalStaffOrReadOnly,
    IsDoctor,
    IsNurse,
)
from apps.core.responses import (
    created_response,
    no_content_response,
    paginated_response,
    success_response,
)

__all__ = [
    "BaseModel",
    "SoftDeleteModel",
    "SoftDeleteManager",
    "AllObjectsManager",
    "ApplicationError",
    "NotFoundError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ConflictError",
    "RateLimitExceededError",
    "success_response",
    "created_response",
    "no_content_response",
    "paginated_response",
    "StandardResultsPagination",
    "IsAdmin",
    "IsDoctor",
    "IsNurse",
    "IsAnalyst",
    "IsAdminOrDoctor",
    "IsAdminOrDoctorOrNurse",
    "IsClinicalStaffOrReadOnly",
]
