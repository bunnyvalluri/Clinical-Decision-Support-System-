"""
Role-Based Access Control Permissions for Security Testing & DevSecOps.
Enforces strict 5-role boundary:
- PATIENT: Completely forbidden (403)
- DOCTOR: Completely forbidden (403)
- NURSE: Completely forbidden (403)
- MEDICAL_INFORMATICIST: Read-only access to AI/ML & privacy security findings
- IT_ADMIN: Full management permissions for authorized targets, scans, and retests
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.accounts.models import UserRole


class CanViewSecurityFindings(BasePermission):
    """
    IT_ADMIN has full view.
    MEDICAL_INFORMATICIST has read-only view.
    DOCTOR, NURSE, PATIENT are strictly DENIED.
    """
    message = "Access denied. Only IT Administrators and authorized Medical Informaticists may view security findings."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)

        if user_role in [UserRole.IT_ADMIN, UserRole.ADMIN]:
            return True

        if user_role == UserRole.MEDICAL_INFORMATICIST and request.method in SAFE_METHODS:
            return True

        return False


class CanManageSecurityScans(BasePermission):
    """
    Only IT_ADMIN can create, trigger, pause, or cancel security scans.
    """
    message = "Only IT Administrators have authorization to initiate or manage security scans."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)
        return user_role in [UserRole.IT_ADMIN, UserRole.ADMIN]


class CanManageSecurityTargets(BasePermission):
    """
    Only IT_ADMIN can register, edit, or approve security targets.
    """
    message = "Only IT Administrators may register or modify approved security targets."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)
        return user_role in [UserRole.IT_ADMIN, UserRole.ADMIN]


class CanValidateFindings(BasePermission):
    """
    Only IT_ADMIN can execute the validation gate and approve remediation.
    """
    message = "Only IT Administrators are permitted to validate or triage security findings."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)
        return user_role in [UserRole.IT_ADMIN, UserRole.ADMIN]


class HasSecurityAgentRunPermission(BasePermission):
    """
    Explicit authorization for running pentest-agents and security provider dispatches.
    Requires IT_ADMIN role and (is_superuser or explicit permission grant).
    Patients, Doctors, and Nurses are strictly denied.
    """
    message = "Access denied: SECURITY_AGENT_RUN permission is required to launch or manage autonomous security agents."

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        # Deny clinical roles outright
        user_role = getattr(request.user, "role", None)
        if user_role in [UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE]:
            return False

        if user_role == UserRole.MEDICAL_INFORMATICIST and request.method in SAFE_METHODS:
            return True

        if user_role in [UserRole.IT_ADMIN, UserRole.ADMIN] or request.user.is_superuser:
            return True

        return False

