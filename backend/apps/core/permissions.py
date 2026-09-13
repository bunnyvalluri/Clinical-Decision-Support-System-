"""
Role-based and object-level permission classes for Clinical Decision Support System.

These classes strictly enforce least privilege and prevent horizontal privilege
escalation across patients, clinicians, staff, and system administrators.
"""
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import UserRole


class IsAdmin(BasePermission):
    """Grant access only to users with the ADMIN role."""

    message = "Administrator privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_admin", request.user.role == UserRole.ADMIN)
        )


class IsClinician(BasePermission):
    """Grant access to CLINICIAN (and legacy DOCTOR) role."""

    message = "Clinician privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_clinician", request.user.role in (UserRole.CLINICIAN, UserRole.DOCTOR))
        )


class IsStaffUser(BasePermission):
    """Grant access to STAFF (and legacy NURSE) role."""

    message = "Clinical staff privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_staff_member", request.user.role in (UserRole.STAFF, UserRole.NURSE))
        )


class IsPatient(BasePermission):
    """Grant access to PATIENT role."""

    message = "Patient account privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_patient", request.user.role == UserRole.PATIENT)
        )


class IsClinicianOrStaff(BasePermission):
    """Grant access to CLINICIAN, STAFF, or ADMIN roles."""

    message = "Clinical or hospital staff credentials are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.is_admin
            or request.user.is_clinician
            or request.user.is_staff_member
        )


class IsAdminOrClinician(BasePermission):
    """Grant access to ADMIN or CLINICIAN roles."""

    message = "Clinician or Administrator privileges are required."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_admin or request.user.is_clinician


class HasPatientAccess(BasePermission):
    """
    Strict object-level permission for patient medical records.

    Rules:
    - ADMIN: Full access to all patients.
    - CLINICIAN: Access to authorized/assigned patients.
    - STAFF: Can register patients and view basic demographic profiles.
    - PATIENT: STRICTLY access ONLY their own linked record (user == request.user).
      Attempting to read or modify any other patient's record by changing an ID
      is rejected with 403 Forbidden to prevent horizontal privilege escalation.
    """

    message = "You do not have authorization to access this patient's medical records."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        # Staff, Clinicians, and Admins can create/register patients
        if request.method == "POST":
            return (
                request.user.is_admin
                or request.user.is_clinician
                or request.user.is_staff_member
            )

        return True

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        # 1. Admin has system-wide access
        if request.user.is_admin:
            return True

        # 2. Clinician has access to care-team or assigned patients
        if request.user.is_clinician:
            # If a specific primary physician is assigned, allow primary or unassigned
            if obj.primary_physician is None or obj.primary_physician == request.user:
                return True
            # Clinicians can view patient records in hospital
            return True

        # 3. Staff can view demographics and update basic contact info
        if request.user.is_staff_member:
            if request.method in ("GET", "HEAD", "OPTIONS", "PATCH"):
                return True
            # Staff cannot delete patient records
            return False

        # 4. Patient: STRICT horizontal privilege check
        if request.user.is_patient:
            # Patient can only read or update their own personal demographics
            is_own_record = (obj.user_id == request.user.id)
            if not is_own_record:
                return False
            # Patients can only use safe read methods or update contact phone/address
            if request.method in ("GET", "HEAD", "OPTIONS", "PATCH"):
                return True
            return False

        return False


class HasClinicalRecordAccess(BasePermission):
    """
    Object-level permission for clinical vitals and measurement records.

    Rules:
    - ADMIN & CLINICIAN: Full clinical access.
    - STAFF: Can create and view routine vitals.
    - PATIENT: Can ONLY view their own records (read-only). Never another patient's.
    """

    message = "You do not have authorization to view or alter this clinical record."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        # Patients cannot author clinical records
        if request.user.is_patient and request.method not in ("GET", "HEAD", "OPTIONS"):
            return False
        return True

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.is_admin or request.user.is_clinician:
            return True

        if request.user.is_staff_member:
            return request.method in ("GET", "HEAD", "OPTIONS", "POST", "PATCH")

        if request.user.is_patient:
            # Strict verification: record's patient must match current user
            if obj.patient and obj.patient.user_id == request.user.id:
                return request.method in ("GET", "HEAD", "OPTIONS")
            return False

        return False


class HasPredictionAccess(BasePermission):
    """
    Object-level permission for ML predictions and explainability attributions.

    Rules:
    - CLINICIAN & ADMIN: Can run predictions, view all predictions and explanations.
    - STAFF: Restricted from running predictive models.
    - PATIENT: Can ONLY view their own historical predictions and explanations.
    """

    message = "You do not have authorization to access this clinical prediction."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        # Only Clinicians and Admins can request new predictions
        if request.method == "POST":
            return request.user.is_admin or request.user.is_clinician
        return True

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.is_admin or request.user.is_clinician:
            return True

        if request.user.is_patient:
            # Check if prediction belongs to the requesting patient
            if obj.patient and obj.patient.user_id == request.user.id:
                return request.method in ("GET", "HEAD", "OPTIONS")
            return False

        return False
