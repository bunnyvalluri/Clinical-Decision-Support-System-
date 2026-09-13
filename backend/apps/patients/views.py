"""
Views for patients app — patient registration, demographics, and medical profile.
Enforces strict object-level authorization to prevent horizontal privilege escalation.
"""
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import HasPatientAccess
from apps.patients.models import Patient
from apps.patients.serializers import PatientRegistrationSerializer, PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    """
    Patient management endpoints with strict object-level authorization.

    GET    /api/v1/patients/          — List patients (scoped to role)
    POST   /api/v1/patients/          — Register patient (Clinician / Staff / Admin)
    GET    /api/v1/patients/{id}/     — Retrieve patient record
    PUT    /api/v1/patients/{id}/     — Update patient record
    PATCH  /api/v1/patients/{id}/     — Partial update
    DELETE /api/v1/patients/{id}/     — Soft-delete patient record (Admin only)
    """

    permission_classes = [permissions.IsAuthenticated, HasPatientAccess]
    pagination_class = StandardResultsPagination
    search_fields = ["mrn", "first_name", "last_name", "phone_number", "email"]
    ordering_fields = ["created_at", "last_name", "date_of_birth", "mrn"]

    def get_serializer_class(self):
        if self.action == "create":
            return PatientRegistrationSerializer
        return PatientSerializer

    def get_queryset(self):
        user = self.request.user

        # Horizontal Escalation Guard:
        # A PATIENT can strictly only ever query their own patient demographic record
        if user.is_patient:
            return Patient.objects.filter(user=user)

        # Clinicians, Staff, and Admins can query active patient records
        return Patient.objects.filter(is_active=True).select_related("primary_physician")

    def get_object(self) -> Patient:
        """
        Retrieve object with explicit object-level authorization check.
        Guarantees that a PATIENT attempting to query another patient's ID
        is stopped with 403 Forbidden rather than simply 404 Not Found.
        """
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        # Fetch from all active patients to evaluate object permission
        try:
            obj = Patient.objects.get(pk=lookup_value)
        except (Patient.DoesNotExist, ValueError):
            from apps.core.exceptions import NotFoundError
            raise NotFoundError(f"Patient with ID {lookup_value} was not found.")

        # Crucial security check: raises PermissionDenied (403) if unauthorized
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_destroy(self, instance: Patient) -> None:
        # Only administrators can soft-delete patient records
        if not self.request.user.is_admin:
            raise PermissionDenied("Only system administrators can delete patient records.")
        instance.delete()
