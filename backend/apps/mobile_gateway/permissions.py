"""
Role-Based Access Control & Separation of Duties for Healthcare Mobile Gateway.

Enforces:
1. Patient Isolation: Patients can view/register/revoke only their OWN devices and events.
2. Clinical Privacy Boundary: Doctors & Nurses are strictly forbidden from surveilling
   patient SMS, call logs, and personal notifications.
3. Informaticist Aggregation Gate: Medical Informaticists can access aggregate telemetry
   and data-quality metrics only, with raw personal text blocked.
4. IT Admin Governance: System administrators manage device approvals, destinations,
   and the emergency kill switch.
"""
from rest_framework import permissions
from apps.accounts.models import UserRole


class IsITAdminUser(permissions.BasePermission):
    """Allows access only to IT Administrators."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.role in [UserRole.IT_ADMIN, UserRole.ADMIN]
            or request.user.is_superuser
        )


class IsInformaticistOrAdmin(permissions.BasePermission):
    """Allows access to Informaticists and IT Administrators for telemetry/quality."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.role in [UserRole.MEDICAL_INFORMATICIST, UserRole.ANALYST, UserRole.IT_ADMIN, UserRole.ADMIN]
            or request.user.is_superuser
        )


class IsPatientOwnerOrAdmin(permissions.BasePermission):
    """
    Allows Patients to access only their own registered devices and events.
    IT Admins can inspect device registry for security lifecycle management.
    Clinicians (Doctors/Nurses) are explicitly denied surveillance privileges.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Clinicians are blocked from direct mobile device/message surveillance
        if request.user.role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.NURSE]:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # IT Admin has operational management
        if request.user.role in [UserRole.IT_ADMIN, UserRole.ADMIN] or request.user.is_superuser:
            return True

        # Patient can only access their own device / event
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "device") and hasattr(obj.device, "user"):
            return obj.device.user == request.user

        return False


class DenyClinicianSurveillance(permissions.BasePermission):
    """
    Deterministic rule: Doctors and Nurses cannot read raw patient communications.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.NURSE]:
            return False
        return True
