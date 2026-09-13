"""
Views for patients app — patient registration, demographics, and medical profile.
Enforces strict object-level authorization to prevent horizontal privilege escalation.
"""
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.request import Request
from rest_framework.response import Response

from apps.clinical.filters import ClinicalRecordFilter
from apps.clinical.models import ClinicalRecord
from apps.clinical.serializers import (
    ClinicalRecordCreateUpdateSerializer,
    ClinicalRecordSerializer,
)
from apps.core.mixins import AuditLogMixin
from apps.core.models import AuditLog
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import HasPatientAccess
from apps.patients.filters import PatientFilter
from apps.patients.models import Patient
from apps.patients.serializers import (
    PatientRegistrationSerializer,
    PatientSerializer,
    PatientUpdateSerializer,
)


class PatientViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Patient management endpoints with strict object-level authorization.

    GET    /api/v1/patients/                             — List patients (scoped to role)
    POST   /api/v1/patients/                             — Register patient (Clinician / Staff / Admin)
    GET    /api/v1/patients/{id}/                        — Retrieve patient record
    PUT    /api/v1/patients/{id}/                        — Update patient record
    PATCH  /api/v1/patients/{id}/                        — Partial update
    DELETE /api/v1/patients/{id}/                        — Soft-delete patient record (Admin only)
    GET    /api/v1/patients/{id}/clinical-records/       — List patient encounter history
    POST   /api/v1/patients/{id}/clinical-records/       — Record new clinical encounter
    """

    permission_classes = [permissions.IsAuthenticated, HasPatientAccess]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = PatientFilter
    search_fields = ["mrn", "first_name", "last_name", "phone_number", "email"]
    ordering_fields = ["created_at", "last_name", "first_name", "date_of_birth", "mrn"]
    ordering = ["-created_at"]
    audit_resource_type = "Patient"

    def get_serializer_class(self):
        if self.action == "create":
            return PatientRegistrationSerializer
        if self.action in ("update", "partial_update"):
            return PatientUpdateSerializer
        return PatientSerializer

    def get_queryset(self):
        user = self.request.user

        # Horizontal Escalation Guard:
        # A PATIENT can strictly only ever query their own patient demographic record
        if user.is_patient:
            return Patient.objects.filter(user=user).select_related("primary_physician", "user")

        # Clinicians, Staff, and Admins can query active patient records
        return Patient.objects.filter(is_active=True).select_related("primary_physician", "user")

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
            obj = Patient.objects.select_related("primary_physician", "user").get(pk=lookup_value)
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
        self._log(
            self.request,
            action=AuditLog.Action.DELETE,
            resource_id=str(instance.pk),
            description=f"Soft-deleted patient {instance.mrn}.",
        )
        instance.delete()

    @action(detail=True, methods=["get", "post"], url_path="clinical-records")
    def clinical_records(self, request: Request, pk=None) -> Response:
        """
        Nested clinical record endpoints:
        GET  /api/v1/patients/{id}/clinical-records/ — List patient vitals and lab encounters
        POST /api/v1/patients/{id}/clinical-records/ — Record new encounter vitals for patient
        """
        patient = self.get_object()

        if request.method == "GET":
            # Patient can only view their own clinical records
            if request.user.is_patient and patient.user_id != request.user.id:
                raise PermissionDenied("You do not have permission to view clinical records for this patient.")

            records_qs = (
                ClinicalRecord.objects.filter(patient=patient)
                .select_related("patient", "patient__primary_physician", "recorded_by")
                .order_by("-recorded_at")
            )

            # Support filtering
            filterset = ClinicalRecordFilter(request.GET, queryset=records_qs, request=request)
            if filterset.is_valid():
                records_qs = filterset.qs

            # Support search
            search_query = request.query_params.get("search")
            if search_query:
                records_qs = records_qs.filter(
                    models.Q(symptoms__icontains=search_query)
                    | models.Q(clinical_notes__icontains=search_query)
                )

            # Support ordering
            ordering_param = request.query_params.get("ordering")
            if ordering_param in (
                "recorded_at",
                "-recorded_at",
                "created_at",
                "-created_at",
                "heart_rate",
                "-heart_rate",
                "systolic_bp",
                "-systolic_bp",
            ):
                records_qs = records_qs.order_by(ordering_param)

            page = self.paginate_queryset(records_qs)
            if page is not None:
                serializer = ClinicalRecordSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = ClinicalRecordSerializer(records_qs, many=True)
            return Response({"success": True, "data": serializer.data})

        # POST
        if request.user.is_patient:
            raise PermissionDenied("Patients cannot create clinical records.")

        serializer = ClinicalRecordCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save(patient=patient, recorded_by=request.user)

        self._log(
            request,
            action=AuditLog.Action.CREATE,
            resource_id=str(record.pk),
            description=f"Recorded {record.encounter_type} encounter vitals for patient {patient.mrn}.",
            metadata={"patient_id": str(patient.id), "encounter_type": record.encounter_type},
        )

        out_serializer = ClinicalRecordSerializer(record)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)
