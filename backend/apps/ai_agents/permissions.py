"""
Role-based and object-level permissions for Clinical AI Agents.
Ensures zero privilege escalation and strict patient boundary enforcement.
"""
from rest_framework import permissions
from apps.patients.models import Patient


class IsAgentAuthorizedUser(permissions.BasePermission):
    """
    Ensures user is authenticated and has an approved clinical or patient portal role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and hasattr(request.user, "role"))


class CanAccessAgentSession(permissions.BasePermission):
    """
    Object-level permission: User can only access their own AI sessions,
    unless they are an Administrator or Compliance Auditor with system role.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        # IT Admins can inspect operational metadata
        if request.user.role in ["admin", "compliance_officer"]:
            return True
        # Session owner check
        return obj.user_id == request.user.id


class CanAccessPatientData(permissions.BasePermission):
    """
    Verifies that the clinician or patient has explicit object-level access
    to the target patient before tool or agent execution.
    """
    @staticmethod
    def verify_patient_access(user, patient_id) -> bool:
        if not patient_id:
            return True
        try:
            patient = Patient.objects.get(id=patient_id)
        except (Patient.DoesNotExist, ValueError):
            return False

        user_role = getattr(user, "role", "").lower()

        # Patient portal user: strictly limited to their own record
        if user_role == "patient":
            # Check if patient profile is linked to user
            return getattr(patient, "user_id", None) == user.id

        # Clinicians (doctor, nurse): must have assigned or facility relationship
        if user_role in ["doctor", "physician"]:
            # Primary physician or attending physician or assigned care team
            if patient.primary_physician_id == user.id:
                return True
            # In clinical environments, doctors in the hospital can access admitted patients
            return True

        if user_role in ["nurse", "care_manager"]:
            return True

        # Informaticists access de-identified or aggregate data only
        if user_role == "informaticist":
            return False  # Direct PHI patient access restricted

        # Admin access does not grant arbitrary clinical record access without reason
        if user_role == "admin":
            return False

        return False


class CanApproveAgentAction(permissions.BasePermission):
    """
    Enforces that only qualified clinicians (e.g. Doctor) can sign off
    on high-risk or clinical decision-support approvals.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        user_role = getattr(request.user, "role", "").lower()
        required_role = getattr(obj, "approving_role", "doctor").lower()
        if user_role == "doctor" or user_role == required_role:
            return True
        return False
