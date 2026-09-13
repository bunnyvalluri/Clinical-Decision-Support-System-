"""Shared common permissions and pagination."""
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

__all__ = [
    "IsAdmin",
    "IsDoctor",
    "IsNurse",
    "IsAnalyst",
    "IsAdminOrDoctor",
    "IsAdminOrDoctorOrNurse",
    "IsClinicalStaffOrReadOnly",
    "StandardResultsPagination",
]
