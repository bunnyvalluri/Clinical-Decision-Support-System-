"""
Role-based access control and dataset scoping for NocoDB Healthcare Analytics.
Enforces zero-PHI leakage, minimum necessary standard, and persona boundary gates.
"""
from rest_framework import permissions
from apps.accounts.models import UserRole
from apps.nocodb.models import NocoDBDataset


def normalize_role(role_val: str) -> str:
    """Normalize UserRole enum string to standard lowercase token."""
    if not role_val:
        return "anonymous"
    r = str(role_val).upper()
    if r in [UserRole.IT_ADMIN, UserRole.ADMIN]:
        return "admin"
    if r == UserRole.MEDICAL_INFORMATICIST or r == "INFORMATICIST":
        return "informaticist"
    if r in [UserRole.DOCTOR, UserRole.CLINICIAN]:
        return "doctor"
    if r == UserRole.NURSE:
        return "nurse"
    if r == UserRole.PATIENT:
        return "patient"
    return str(role_val).lower()


class CanAccessNocoDBWorkspace(permissions.BasePermission):
    """
    Ensures the user is authenticated and belongs to an authorized clinical/admin role.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, "role", "")
        # Superusers always allowed
        if request.user.is_superuser:
            return True
        norm = normalize_role(role)
        return norm in ["admin", "informaticist", "doctor", "nurse", "patient"]


class CanAccessDataset(permissions.BasePermission):
    """
    Object-level permission checking if user's role is in dataset.allowed_roles.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj: NocoDBDataset):
        if request.user.is_superuser:
            return True
        role = normalize_role(getattr(request.user, "role", ""))
        allowed = [r.lower() for r in (obj.allowed_roles or [])]
        # Admin alias
        if role == "admin" and ("admin" in allowed or "it_admin" in allowed):
            return True
        return role in allowed


class CanMutateNocoDBData(permissions.BasePermission):
    """
    Restricts write/mutation capabilities on analytical records to Informaticists and IT Admins.
    Doctors, Nurses, and Patients are strictly Read-Only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        role = normalize_role(getattr(request.user, "role", ""))
        return role in ["admin", "informaticist"]


class CanManageNocoDBSchema(permissions.BasePermission):
    """
    Restricts dataset and schema creation/editing to IT Admins and Medical Informaticists.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        role = normalize_role(getattr(request.user, "role", ""))
        return role in ["admin", "informaticist"]


class CanExportNocoDBDataset(permissions.BasePermission):
    """
    Permits dataset export with formula sanitization for Admin, Informaticist, and Doctor.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        role = normalize_role(getattr(request.user, "role", ""))
        return role in ["admin", "informaticist", "doctor"]
