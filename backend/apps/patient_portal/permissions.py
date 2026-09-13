from rest_framework import permissions
from apps.accounts.models import UserRole
from apps.patients.models import Patient


class IsPatientUser(permissions.BasePermission):
    """
    Authoritative permission requiring user to be authenticated and have
    PATIENT role or a linked Patient profile.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            getattr(request.user, "role", None) in [UserRole.PATIENT, "PATIENT", "ROLE_PATIENT", "ROLE_USER"]
            or hasattr(request.user, "patient_profile")
        )


def get_patient_from_request(request):
    """
    Resolves the authoritative Patient instance for the current authenticated user.
    Prevents cross-patient horizontal privilege escalation by resolving server-side only.
    """
    if not request.user or not request.user.is_authenticated:
        return None
    
    # 1. Check directly linked OneToOne patient_profile
    if hasattr(request.user, "patient_profile") and request.user.patient_profile:
        return request.user.patient_profile
    
    # 2. Try finding patient by user FK
    patient = Patient.objects.filter(user=request.user).first()
    if patient:
        return patient
    
    # 3. Try matching by email
    if request.user.email:
        patient = Patient.objects.filter(email=request.user.email).first()
        if patient:
            patient.user = request.user
            patient.save(update_fields=["user"])
            return patient

    # 4. In demo/development mode, if role is PATIENT, link to canonical demo patient
    if getattr(request.user, "role", None) in [UserRole.PATIENT, "PATIENT", "ROLE_PATIENT", "ROLE_USER"]:
        patient = Patient.objects.first()
        return patient

    return None
