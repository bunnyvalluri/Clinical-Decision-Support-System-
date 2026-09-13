"""
Views for clinical app — clinical encounters, vitals observations, and laboratory panels.
Enforces strict object-level authorization (preventing horizontal escalation) and audit logging.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
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
from apps.core.exceptions import NotFoundError
from apps.core.mixins import AuditLogMixin
from apps.core.models import AuditLog
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import HasClinicalRecordAccess


class ClinicalRecordViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Clinical records management endpoints with strict object-level authorization.

    GET    /api/v1/clinical-records/          — List clinical records (scoped to user role)
    POST   /api/v1/clinical-records/          — Record new clinical encounter
    GET    /api/v1/clinical-records/{id}/     — Retrieve individual clinical record
    PATCH  /api/v1/clinical-records/{id}/     — Update clinical vitals/labs
    DELETE /api/v1/clinical-records/{id}/     — Soft-delete clinical record (Admin only)
    """

    permission_classes = [permissions.IsAuthenticated, HasClinicalRecordAccess]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ClinicalRecordFilter
    search_fields = [
        "symptoms",
        "clinical_notes",
        "patient__mrn",
        "patient__first_name",
        "patient__last_name",
    ]
    ordering_fields = [
        "recorded_at",
        "created_at",
        "heart_rate",
        "systolic_bp",
        "body_temperature",
    ]
    ordering = ["-recorded_at"]
    audit_resource_type = "ClinicalRecord"

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ClinicalRecordCreateUpdateSerializer
        return ClinicalRecordSerializer

    def get_queryset(self):
        user = self.request.user

        # Horizontal privilege protection:
        # A patient can strictly only query their own clinical encounter history
        if user.is_patient:
            return (
                ClinicalRecord.objects.filter(patient__user=user)
                .select_related("patient", "patient__primary_physician", "recorded_by")
            )

        # Clinicians, Staff, and Admins can query clinical records across patients
        return (
            ClinicalRecord.objects.all()
            .select_related("patient", "patient__primary_physician", "recorded_by")
        )

    def get_object(self) -> ClinicalRecord:
        """
        Retrieve record with strict object-level authorization check.
        Raises 403 Forbidden rather than 404 if horizontal unauthorized access is attempted.
        """
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        try:
            obj = (
                ClinicalRecord.objects.select_related(
                    "patient", "patient__primary_physician", "recorded_by"
                ).get(pk=lookup_value)
            )
        except (ClinicalRecord.DoesNotExist, ValueError):
            raise NotFoundError(f"Clinical record with ID {lookup_value} was not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        instance = self.get_object()
        serializer = ClinicalRecordSerializer(instance)
        return Response(serializer.data)

    def update(self, request: Request, *args, **kwargs) -> Response:
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = ClinicalRecordCreateUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()

        self._log(
            request,
            action=AuditLog.Action.UPDATE,
            resource_id=str(updated_instance.pk),
            description=f"Updated clinical record {updated_instance.id} for patient {updated_instance.patient.mrn}.",
        )

        out_serializer = ClinicalRecordSerializer(updated_instance)
        return Response(out_serializer.data)

    def perform_destroy(self, instance: ClinicalRecord) -> None:
        if not self.request.user.is_admin:
            raise PermissionDenied("Only system administrators can delete clinical records.")
        self._log(
            self.request,
            action=AuditLog.Action.DELETE,
            resource_id=str(instance.pk),
            description=f"Soft-deleted clinical record {instance.id}.",
        )
        instance.delete()
