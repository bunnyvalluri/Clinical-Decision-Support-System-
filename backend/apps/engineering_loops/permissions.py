"""
Permissions for Engineering Loops (Prompt 45).
Enforces strict role boundary:
- PATIENT: Denied (403)
- DOCTOR: Denied (403)
- NURSE: Denied (403)
- MEDICAL_INFORMATICIST: Read-only access to engineering/ML health
- IT_ADMIN: Full engineering loop management
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.accounts.models import UserRole


class CanManageEngineeringLoops(BasePermission):
    """IT Administrators have full management; Informaticists have read-only."""

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)

        if user_role in [UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE]:
            return False

        if user_role == UserRole.MEDICAL_INFORMATICIST and request.method in SAFE_METHODS:
            return True

        if user_role in [UserRole.IT_ADMIN, UserRole.ADMIN] or request.user.is_superuser:
            return True

        return False
