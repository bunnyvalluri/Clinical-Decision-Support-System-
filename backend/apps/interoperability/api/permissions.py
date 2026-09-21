"""
Interoperability RBAC and Security Permissions — BPY-CSE-2666.
"""
from rest_framework.permissions import BasePermission
from apps.accounts.models import UserRole


class CanAccessInteroperability(BasePermission):
    """
    Permits IT Administrators and Medical Informaticists to view and manage interoperability.
    """

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_admin:
            return True
        return request.user.role in (
            UserRole.IT_ADMIN,
            UserRole.ADMIN,
            UserRole.MEDICAL_INFORMATICIST,
            UserRole.ANALYST,
        )


class CanResolveConflicts(BasePermission):
    """
    Permits Medical Informaticists and Attending Physicians to resolve clinical mapping conflicts.
    """

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_admin:
            return True
        return request.user.role in (
            UserRole.MEDICAL_INFORMATICIST,
            UserRole.DOCTOR,
            UserRole.CLINICIAN,
            UserRole.ANALYST,
        )


class IsAuthorizedFHIRExternalClient(BasePermission):
    """
    Validates external healthcare system credentials for direct FHIR API endpoints.
    Allows either an authenticated session or a valid registered system API key/Bearer token.
    """

    def has_permission(self, request, view) -> bool:
        # Authenticated internal users
        if request.user and request.user.is_authenticated:
            return True

        # Check for external API key or Bearer token
        auth_header = request.headers.get("Authorization", "")
        api_key_header = request.headers.get("X-API-Key", "")

        from apps.interoperability.models import FHIREndpoint

        if api_key_header:
            return FHIREndpoint.objects.filter(
                is_active=True,
                auth_config__api_key=api_key_header,
            ).exists()

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            return FHIREndpoint.objects.filter(
                is_active=True,
                auth_config__token=token,
            ).exists()

        return False
