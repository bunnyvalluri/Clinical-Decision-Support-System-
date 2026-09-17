"""
Object-level permissions and clinical role gates for Clinical Whiteboards.
Enforces zero-PHI leakage, patient boundaries, and clinical sign-off requirements.
"""
from rest_framework import permissions
from apps.accounts.models import UserRole
from apps.whiteboards.models import ClinicalWhiteboard, DataClassification, WhiteboardStatus, WhiteboardType


class CanAccessWhiteboard(permissions.BasePermission):
    """
    Object-level permission evaluating user role, whiteboard classification,
    patient linkage, and active status.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj: ClinicalWhiteboard):
        user = request.user
        role = getattr(user, "role", "")

        # 1. Soft-deleted / Purged checks
        if obj.status in [WhiteboardStatus.PURGED, WhiteboardStatus.DELETED_PENDING_RETENTION]:
            return role in [UserRole.IT_ADMIN, UserRole.ADMIN]

        # 2. Patient-specific access
        if role == UserRole.PATIENT:
            # Patients can ONLY access APPROVED Care Plans or Patient Journeys linked to their own record
            if obj.type not in [WhiteboardType.CARE_PLAN, WhiteboardType.PATIENT_JOURNEY]:
                return False
            if obj.status != WhiteboardStatus.APPROVED:
                return False
            # Check if linked patient matches user
            patient = getattr(user, "patient_profile", None)
            if not patient or obj.patient != patient:
                return False
            # Patients have read-only access
            return request.method in permissions.SAFE_METHODS

        # 3. IT Admin access
        if role in [UserRole.IT_ADMIN, UserRole.ADMIN]:
            # IT Admins manage system architectures, incidents, and infrastructure boards.
            # IT Admins are FORBIDDEN from viewing PHI boards without clinical justification.
            if obj.is_phi or obj.classification in [DataClassification.PHI, DataClassification.RESTRICTED]:
                # Safe inspection only if explicitly designated, else block
                return False
            return True

        # 4. Medical Informaticist access
        if role == UserRole.MEDICAL_INFORMATICIST:
            # Informaticists manage ML, AI, Data Lineage, and System Architecture boards
            if obj.type in [
                WhiteboardType.ML_WORKFLOW,
                WhiteboardType.AI_WORKFLOW,
                WhiteboardType.DATA_LINEAGE,
                WhiteboardType.SYSTEM_ARCHITECTURE,
                WhiteboardType.DECISION_TREE,
                WhiteboardType.RISK_ANALYSIS,
                WhiteboardType.GENERAL,
            ]:
                # If marked PHI or has direct patient link, require safe methods only
                if obj.is_phi and request.method not in permissions.SAFE_METHODS:
                    return False
                return True
            # For general care plans, informaticists have view-only unless owner
            if request.method in permissions.SAFE_METHODS:
                return True
            return obj.owner == user

        # 5. Clinicians (Doctors and Nurses)
        if role in [UserRole.DOCTOR, UserRole.CLINICIAN]:
            # Doctors have full clinical authority
            # If board is locked by clinical approval, only safe methods or unlocking is allowed
            if obj.is_locked and request.method not in permissions.SAFE_METHODS:
                if view.action not in ["review", "restore"]:
                    return False
            return True

        if role == UserRole.NURSE:
            # Nurses have full access to care plans, workflows, triage, and handovers
            if obj.type in [
                WhiteboardType.CARE_PLAN,
                WhiteboardType.CLINICAL_WORKFLOW,
                WhiteboardType.PATIENT_JOURNEY,
                WhiteboardType.TRIAGE_WORKFLOW,
                WhiteboardType.TEAM_COLLABORATION,
                WhiteboardType.GENERAL,
            ]:
                if obj.is_locked and request.method not in permissions.SAFE_METHODS:
                    return False
                return True
            # Other board types read-only for nurses
            return request.method in permissions.SAFE_METHODS

        # Default fallback: owner can edit if not locked, others read-only if internal
        if obj.owner == user:
            return not obj.is_locked or request.method in permissions.SAFE_METHODS

        return request.method in permissions.SAFE_METHODS


class CanReviewWhiteboard(permissions.BasePermission):
    """
    Clinical review permission:
    - Doctors/Admins can APPROVE or ARCHIVE.
    - Nurses/Doctors can SUBMIT or REQUEST_CHANGES.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(user, "role", "")
        review_action = request.data.get("action", "")
        if review_action == "SUBMIT":
            return role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.NURSE, UserRole.ADMIN]
        return role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]


class CanRestoreWhiteboard(permissions.BasePermission):
    """
    Version restore permission: Authorized clinicians or administrators only.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(user, "role", "")
        return role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.MEDICAL_INFORMATICIST, UserRole.ADMIN, UserRole.IT_ADMIN]
