"""
Interoperability API Views — BPY-CSE-2666 (Sections 21, 22, 28).
Provides standards-compliant HL7 FHIR R4 endpoints, administrative dashboards,
conflict resolution workflows, and telemetry inspection.
"""
import time
from typing import Any, Dict
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.interoperability.application.conflict_service import ConflictService
from apps.interoperability.application.export_service import OutboundExportService
from apps.interoperability.application.import_service import InboundImportService
from apps.interoperability.domain.enums import ConflictStatus, FHIRResourceStatus, SyncDirection, SyncStatus
from apps.interoperability.domain.exceptions import (
    ClinicalBoundsViolationError,
    FHIRMappingError,
    FHIRSecurityError,
    FHIRValidationError,
    OverwriteProtectionError,
)
from apps.interoperability.infrastructure.celery_tasks import execute_fhir_sync_job_task
from apps.interoperability.infrastructure.repositories import InteroperabilityRepository
from apps.interoperability.models import (
    ExternalSystem,
    FHIRExportJob,
    FHIRImportJob,
    FHIRMappingConflict,
    FHIRMappingVersion,
    FHIRProvenanceRecord,
    FHIRResourceRecord,
    FHIRValidationResult,
    IntegrationAuditEvent,
    IntegrationConnection,
    IntegrationHealthStatus,
    PatientIdentityLink,
    TerminologyMapping,
)
from .permissions import CanAccessInteroperability, CanResolveConflicts, IsAuthorizedFHIRExternalClient
from .serializers import (
    ConflictResolutionSerializer,
    ExportTriggerSerializer,
    ExternalSystemSerializer,
    FHIRExportJobSerializer,
    FHIRImportJobSerializer,
    FHIRMappingConflictSerializer,
    FHIRMappingVersionSerializer,
    FHIRProvenanceRecordSerializer,
    FHIRResourceRecordSerializer,
    FHIRValidationResultSerializer,
    IntegrationAuditEventSerializer,
    IntegrationConnectionSerializer,
    PatientIdentityLinkSerializer,
    SyncTriggerSerializer,
    TerminologyMappingSerializer,
)


class FHIRCapabilityStatementView(APIView):
    """
    Returns FHIR R4 CapabilityStatement (metadata) describing supported resources and operations.
    """
    permission_classes = []  # Publicly readable as per FHIR specification

    def get(self, request, *args, **kwargs):
        cap_statement = {
            "resourceType": "CapabilityStatement",
            "id": "healthnova-ai-fhir-r4",
            "status": "active",
            "date": timezone.now().isoformat(),
            "publisher": "HealthNova AI Clinical Informatics Group",
            "kind": "instance",
            "software": {
                "name": "HealthNova AI CDSS Interoperability Hub",
                "version": "4.0.1",
            },
            "fhirVersion": "4.0.1",
            "format": ["application/fhir+json", "application/json"],
            "rest": [
                {
                    "mode": "server",
                    "documentation": "HealthNova AI FHIR R4 Interoperability Subsystem with Neon PostgreSQL authoritative backing.",
                    "security": {
                        "cors": True,
                        "service": [
                            {
                                "coding": [
                                    {
                                        "system": "http://terminology.hl7.org/CodeSystem/restful-security-service",
                                        "code": "SMART-on-FHIR",
                                        "display": "SMART-on-FHIR",
                                    }
                                ]
                            }
                        ],
                    },
                    "resource": [
                        {
                            "type": "Patient",
                            "interaction": [{"code": "read"}, {"code": "create"}, {"code": "search-type"}],
                        },
                        {
                            "type": "Observation",
                            "interaction": [{"code": "read"}, {"code": "create"}, {"code": "search-type"}],
                        },
                        {
                            "type": "Encounter",
                            "interaction": [{"code": "read"}, {"code": "create"}],
                        },
                        {
                            "type": "RiskAssessment",
                            "interaction": [{"code": "read"}],
                        },
                        {
                            "type": "DiagnosticReport",
                            "interaction": [{"code": "read"}],
                        },
                        {
                            "type": "ServiceRequest",
                            "interaction": [{"code": "read"}],
                        },
                    ],
                }
            ],
        }
        return Response(cap_statement, status=status.HTTP_200_OK, content_type="application/fhir+json")


class FHIRResourceView(APIView):
    """
    Standard FHIR R4 REST endpoint for importing and exporting supported clinical resources.
    Supports GET /fhir/r4/:resource_type/:id and POST /fhir/r4/:resource_type
    """
    permission_classes = [IsAuthorizedFHIRExternalClient]

    def get(self, request, resource_type: str, resource_id: str = "", *args, **kwargs):
        """Export a requested FHIR R4 resource from authoritative Neon PostgreSQL."""
        try:
            if resource_type == "Patient":
                res = OutboundExportService.export_patient(resource_id, user=request.user)
            elif resource_type == "Observation":
                res_list = OutboundExportService.export_clinical_record_observations(resource_id, user=request.user)
                res = res_list[0] if res_list else {}
            elif resource_type == "RiskAssessment":
                res = OutboundExportService.export_prediction_risk_assessment(resource_id, user=request.user)
            else:
                return Response(
                    {"resourceType": "OperationOutcome", "issue": [{"severity": "error", "code": "not-supported", "diagnostics": f"Resource {resource_type} GET not supported."}]},
                    status=status.HTTP_400_BAD_REQUEST,
                    content_type="application/fhir+json",
                )

            return Response(res, status=status.HTTP_200_OK, content_type="application/fhir+json")
        except FHIRMappingError as e:
            return Response(
                {"resourceType": "OperationOutcome", "issue": [{"severity": "error", "code": "not-found", "diagnostics": str(e)}]},
                status=status.HTTP_404_NOT_FOUND,
                content_type="application/fhir+json",
            )
        except Exception as e:
            return Response(
                {"resourceType": "OperationOutcome", "issue": [{"severity": "fatal", "code": "exception", "diagnostics": str(e)}]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/fhir+json",
            )

    def post(self, request, resource_type: str = "", *args, **kwargs):
        """Import an incoming FHIR R4 resource or Bundle into HealthNova AI."""
        payload = request.data
        if not isinstance(payload, dict):
            return Response(
                {"resourceType": "OperationOutcome", "issue": [{"severity": "error", "code": "invalid", "diagnostics": "Payload must be a JSON object."}]},
                status=status.HTTP_400_BAD_REQUEST,
                content_type="application/fhir+json",
            )

        if resource_type and "resourceType" not in payload:
            payload["resourceType"] = resource_type

        try:
            outcome = InboundImportService.import_resource(
                payload=payload,
                user=request.user,
            )

            status_code = status.HTTP_201_CREATED if outcome.get("status") in ("CREATED", "UPDATED") else status.HTTP_200_OK
            if outcome.get("status") == "CONFLICT":
                status_code = status.HTTP_409_CONFLICT

            return Response(outcome, status=status_code, content_type="application/fhir+json")

        except (FHIRValidationError, FHIRSecurityError) as e:
            return Response(
                {"resourceType": "OperationOutcome", "issue": [{"severity": "error", "code": "invalid", "diagnostics": str(e)}]},
                status=status.HTTP_400_BAD_REQUEST,
                content_type="application/fhir+json",
            )
        except Exception as e:
            return Response(
                {"resourceType": "OperationOutcome", "issue": [{"severity": "fatal", "code": "exception", "diagnostics": str(e)}]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type="application/fhir+json",
            )


class FHIRPatientEverythingView(APIView):
    """
    FHIR $everything operation: Exports complete clinical chart bundle for a patient.
    """
    permission_classes = [IsAuthorizedFHIRExternalClient]

    def get(self, request, patient_id: str, *args, **kwargs):
        try:
            bundle = OutboundExportService.export_patient_bundle(patient_id, user=request.user)
            return Response(bundle, status=status.HTTP_200_OK, content_type="application/fhir+json")
        except FHIRMappingError as e:
            return Response(
                {"resourceType": "OperationOutcome", "issue": [{"severity": "error", "code": "not-found", "diagnostics": str(e)}]},
                status=status.HTTP_404_NOT_FOUND,
                content_type="application/fhir+json",
            )


class InformaticistDashboardMetricsView(APIView):
    """
    Medical Informaticist FHIR Data Quality & Telemetry Dashboard (Section 21).
    Calculates real backend-derived metrics. Never displays fabricated counts.
    """
    permission_classes = [CanAccessInteroperability]

    def get(self, request, *args, **kwargs):
        # 1. Total imported records from real import jobs and provenance
        import_agg = FHIRImportJob.objects.aggregate(
            total_imported=Sum("imported_records"),
            total_failed=Sum("failed_records"),
            total_conflicts=Sum("conflicts_generated"),
        )
        resources_imported = import_agg["total_imported"] or FHIRProvenanceRecord.objects.filter(direction="INBOUND_IMPORT").count()
        resources_rejected = import_agg["total_failed"] or 0

        # 2. Real validation & mapping failures
        validation_failures = FHIRValidationResult.objects.count()
        mapping_failures = FHIRValidationResult.objects.filter(rule_code="MAPPING_FAILURE").count()

        # 3. Real duplicate resources & ambiguous patient matches
        duplicate_resources = FHIRMappingConflict.objects.filter(conflict_type="DUPLICATE_PATIENT_MATCH").count()
        ambiguous_patient_matches = FHIRMappingConflict.objects.filter(
            conflict_type="DUPLICATE_PATIENT_MATCH", confidence_score__lt=1.0
        ).count()

        # 4. Real pending reviews
        pending_reviews = FHIRMappingConflict.objects.filter(status=ConflictStatus.PENDING_REVIEW).count()

        # 5. Real export metrics
        export_agg = FHIRExportJob.objects.aggregate(
            total_exported=Sum("exported_records"),
            total_failed=Sum("failed_records"),
        )
        successful_exports = export_agg["total_exported"] or FHIRProvenanceRecord.objects.filter(direction="OUTBOUND_EXPORT").count()
        failed_exports = export_agg["total_failed"] or 0

        # 6. Integration Health overview (Section 22)
        connections = list(IntegrationConnection.objects.values("id", "name", "health_status", "latency_ms", "last_verified_at"))
        
        # Overall integration health determination
        if not connections:
            overall_health = IntegrationHealthStatus.NOT_CONFIGURED
        elif any(c["health_status"] == IntegrationHealthStatus.AUTHENTICATION_FAILED for c in connections):
            overall_health = IntegrationHealthStatus.AUTHENTICATION_FAILED
        elif any(c["health_status"] == IntegrationHealthStatus.OFFLINE for c in connections):
            overall_health = IntegrationHealthStatus.OFFLINE
        elif any(c["health_status"] == IntegrationHealthStatus.DEGRADED for c in connections):
            overall_health = IntegrationHealthStatus.DEGRADED
        elif all(c["health_status"] == IntegrationHealthStatus.CONNECTED for c in connections):
            overall_health = IntegrationHealthStatus.CONNECTED
        else:
            overall_health = IntegrationHealthStatus.UNKNOWN

        # Has data check
        total_activity = (
            resources_imported + resources_rejected + validation_failures +
            duplicate_resources + pending_reviews + successful_exports + len(connections)
        )
        has_data = total_activity > 0

        data = {
            "has_data": has_data,
            "empty_message": "No interoperability data available yet." if not has_data else "",
            "resources_imported": resources_imported,
            "resources_rejected": resources_rejected,
            "validation_failures": validation_failures,
            "mapping_failures": mapping_failures,
            "duplicate_resources": duplicate_resources,
            "ambiguous_patient_matches": ambiguous_patient_matches,
            "total_endpoints": len(connections),
            "pending_conflicts": pending_reviews,
            "success_rate_percent": round(
                (resources_imported / (resources_imported + resources_rejected) * 100)
                if (resources_imported + resources_rejected) > 0
                else 100.0,
                1,
            ),
            "pending_reviews": pending_reviews,
            "successful_exports": successful_exports,
            "failed_exports": failed_exports,
            "overall_integration_health": overall_health,
            "connections": connections,
            "total_connections": len(connections),
            "verified_at": timezone.now().isoformat(),
        }
        return Response(data, status=status.HTTP_200_OK)


# Backward compatibility alias
InteroperabilityDashboardView = InformaticistDashboardMetricsView


class FHIRResourceBoundaryMatrixView(APIView):
    """
    Returns formal FHIR Resource Boundary status (SUPPORTED, PARTIALLY_SUPPORTED, NOT_SUPPORTED, PLANNED).
    """
    permission_classes = [CanAccessInteroperability]

    def get(self, request, *args, **kwargs):
        boundary_matrix = [
            {
                "resource": "Patient",
                "status": FHIRResourceStatus.SUPPORTED,
                "internal_model": "apps.patients.models.Patient",
                "direction": "Bi-directional",
                "description": "Demographics, identifiers (MRN), contact, telecom, emergency contacts.",
            },
            {
                "resource": "Practitioner",
                "status": FHIRResourceStatus.SUPPORTED,
                "internal_model": "apps.accounts.models.User (Roles: DOCTOR, NURSE, INFORMATICIST)",
                "direction": "Bi-directional",
                "description": "Clinical staff identities, credentials, departments, and reference resolution.",
            },
            {
                "resource": "Encounter",
                "status": FHIRResourceStatus.SUPPORTED,
                "internal_model": "apps.clinical.models.ClinicalRecord / TriageRecord",
                "direction": "Bi-directional",
                "description": "Outpatient, inpatient, ICU, and emergency encounters with arrival/discharge times.",
            },
            {
                "resource": "Observation",
                "status": FHIRResourceStatus.SUPPORTED,
                "internal_model": "apps.clinical.models.ClinicalRecord",
                "direction": "Bi-directional",
                "description": "LOINC-coded vitals (BP panel, HR, RR, Temp, SpO2, BMI) and metabolic laboratory panels.",
            },
            {
                "resource": "RiskAssessment",
                "status": FHIRResourceStatus.SUPPORTED,
                "internal_model": "apps.predictions.models.Prediction",
                "direction": "Bi-directional",
                "description": "CDSS machine learning risk tier, probability, confidence, model provenance.",
            },
            {
                "resource": "Organization",
                "status": FHIRResourceStatus.PARTIALLY_SUPPORTED,
                "internal_model": "Hospital Department & Facility Metadata",
                "direction": "Outbound Reference",
                "description": "Custodial organization references for encounters and records.",
            },
            {
                "resource": "Condition",
                "status": FHIRResourceStatus.PARTIALLY_SUPPORTED,
                "internal_model": "ClinicalRecord.symptoms, clinical_notes, Triage chief complaint",
                "direction": "Bi-directional",
                "description": "Clinical presentation and problem list assertions.",
            },
            {
                "resource": "DiagnosticReport",
                "status": FHIRResourceStatus.PARTIALLY_SUPPORTED,
                "internal_model": "apps.reports.models.Report",
                "direction": "Outbound",
                "description": "Structured laboratory panels and CDSS diagnostic summaries.",
            },
            {
                "resource": "ServiceRequest",
                "status": FHIRResourceStatus.PARTIALLY_SUPPORTED,
                "internal_model": "apps.clinical.models.ClinicalTask",
                "direction": "Bi-directional",
                "description": "Bedside clinical task orders (stat lab draws, vitals checks, triage reassessments).",
            },
            {
                "resource": "AllergyIntolerance",
                "status": FHIRResourceStatus.PLANNED,
                "internal_model": "Clinical caution notes",
                "direction": "Planned",
                "description": "Dedicated allergy entity scheduled for Phase 2 CDSS release.",
            },
            {
                "resource": "Medication",
                "status": FHIRResourceStatus.PLANNED,
                "internal_model": "ClinicalTask (MEDICATION_ADMIN)",
                "direction": "Planned",
                "description": "Pharmacy formulary integration scheduled for Phase 2.",
            },
            {
                "resource": "MedicationRequest",
                "status": FHIRResourceStatus.PLANNED,
                "internal_model": "None (Autonomous prescription forbidden by Invariant #3)",
                "direction": "Planned",
                "description": "Read-only external prescription reconciliation scheduled for Phase 2.",
            },
            {
                "resource": "Procedure",
                "status": FHIRResourceStatus.PLANNED,
                "internal_model": "PatientTimelineEvent",
                "direction": "Planned",
                "description": "Clinical procedure tracking scheduled for Phase 2.",
            },
            {
                "resource": "CarePlan",
                "status": FHIRResourceStatus.PLANNED,
                "internal_model": "ClinicalRule protocol actions",
                "direction": "Planned",
                "description": "Unified care coordination protocols scheduled for Phase 2.",
            },
        ]
        return Response({"fhir_version": "4.0.1", "resources": boundary_matrix}, status=status.HTTP_200_OK)


class ExternalSystemViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for registered external healthcare systems.
    """
    queryset = ExternalSystem.objects.all().order_by("name")
    serializer_class = ExternalSystemSerializer
    permission_classes = [CanAccessInteroperability]


class IntegrationConnectionViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for integration connections with verified health check actions.
    """
    queryset = IntegrationConnection.objects.all().select_related("external_system").order_by("name")
    serializer_class = IntegrationConnectionSerializer
    permission_classes = [CanAccessInteroperability]

    @action(detail=True, methods=["post"])
    def test_connection(self, request, pk=None):
        """Test external connection connectivity and CapabilityStatement."""
        connection = self.get_object()
        from apps.interoperability.infrastructure.http_client import FHIRHTTPClient

        url = f"{connection.base_url.rstrip('/')}/metadata"
        headers = {}
        if connection.auth_type == IntegrationConnection.AuthType.BEARER and "token" in connection.auth_config:
            headers["Authorization"] = f"Bearer {connection.auth_config['token']}"
        elif connection.auth_type == IntegrationConnection.AuthType.API_KEY and "api_key" in connection.auth_config:
            headers[connection.auth_config.get("header_name", "X-API-Key")] = connection.auth_config["api_key"]

        try:
            start_t = time.perf_counter()
            resp = FHIRHTTPClient.get(url, headers=headers, timeout=connection.timeout_seconds)
            latency_ms = (time.perf_counter() - start_t) * 1000.0

            connection.health_status = IntegrationHealthStatus.CONNECTED
            connection.latency_ms = round(latency_ms, 2)
            connection.last_verified_at = timezone.now()
            connection.health_details = {
                "fhir_version": resp.get("fhirVersion", "unknown"),
                "software": resp.get("software", {}).get("name", "Unknown"),
            }
            connection.save(update_fields=["health_status", "latency_ms", "last_verified_at", "health_details", "updated_at"])

            IntegrationAuditEvent.objects.create(
                connection=connection,
                actor=request.user if request.user.is_authenticated else None,
                actor_username=request.user.username if request.user.is_authenticated else "System",
                action=IntegrationAuditEvent.Action.INTEGRATION_MODIFIED,
                resource="IntegrationConnection",
                result="CONNECTED",
                details={"latency_ms": round(latency_ms, 2)},
            )

            return Response({
                "status": IntegrationHealthStatus.CONNECTED,
                "latency_ms": round(latency_ms, 2),
                "fhir_version": resp.get("fhirVersion", "unknown"),
                "software": resp.get("software", {}).get("name", "Unknown"),
            })
        except Exception as e:
            err_str = str(e)
            if "401" in err_str or "403" in err_str or "Authentication" in err_str:
                new_status = IntegrationHealthStatus.AUTHENTICATION_FAILED
            else:
                new_status = IntegrationHealthStatus.OFFLINE

            connection.health_status = new_status
            connection.last_verified_at = timezone.now()
            connection.health_details = {"error": err_str}
            connection.save(update_fields=["health_status", "last_verified_at", "health_details", "updated_at"])

            IntegrationAuditEvent.objects.create(
                connection=connection,
                actor=request.user if request.user.is_authenticated else None,
                actor_username=request.user.username if request.user.is_authenticated else "System",
                action=IntegrationAuditEvent.Action.INTEGRATION_MODIFIED,
                resource="IntegrationConnection",
                result=new_status,
                details={"error": err_str},
            )

            return Response(
                {"status": new_status, "error": err_str},
                status=status.HTTP_502_BAD_GATEWAY,
            )


# Backward compatibility alias
FHIREndpointViewSet = IntegrationConnectionViewSet


class FHIRImportJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for monitoring and triggering inbound FHIR import jobs.
    """
    queryset = FHIRImportJob.objects.all().select_related("connection", "triggered_by").order_by("-created_at")
    serializer_class = FHIRImportJobSerializer
    permission_classes = [CanAccessInteroperability]

    @action(detail=False, methods=["post"])
    def trigger(self, request):
        """Trigger an on-demand import job."""
        serializer = SyncTriggerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        connection_id = serializer.validated_data["connection_id"]
        resources = serializer.validated_data["resources"]

        try:
            connection = IntegrationConnection.objects.get(id=connection_id)
        except IntegrationConnection.DoesNotExist:
            return Response({"detail": "Connection not found."}, status=status.HTTP_404_NOT_FOUND)

        job = FHIRImportJob.objects.create(
            connection=connection,
            status=SyncStatus.PENDING,
            resources_requested=resources,
            triggered_by=request.user if request.user.is_authenticated else None,
        )

        IntegrationAuditEvent.objects.create(
            connection=connection,
            actor=request.user if request.user.is_authenticated else None,
            actor_username=request.user.username if request.user.is_authenticated else "System",
            action=IntegrationAuditEvent.Action.IMPORT_STARTED,
            resource=f"FHIRImportJob:{job.id}",
            result="STARTED",
            details={"resources": resources},
        )

        try:
            execute_fhir_sync_job_task.delay(str(job.id))
            is_async = True
        except Exception:
            execute_fhir_sync_job_task(str(job.id))
            is_async = False

        job.refresh_from_db()
        return Response(
            {"job_id": str(job.id), "status": job.status, "async": is_async},
            status=status.HTTP_202_ACCEPTED,
        )


FHIRSyncJobViewSet = FHIRImportJobViewSet


class FHIRExportJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for monitoring and triggering outbound FHIR export jobs.
    """
    queryset = FHIRExportJob.objects.all().select_related("connection", "patient", "triggered_by").order_by("-created_at")
    serializer_class = FHIRExportJobSerializer
    permission_classes = [CanAccessInteroperability]

    @action(detail=False, methods=["post"])
    def trigger(self, request):
        """Trigger an outbound export job."""
        serializer = ExportTriggerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        connection_id = serializer.validated_data["connection_id"]
        resource_type = serializer.validated_data["resource_type"]
        patient_id = serializer.validated_data.get("patient_id")

        try:
            connection = IntegrationConnection.objects.get(id=connection_id)
        except IntegrationConnection.DoesNotExist:
            return Response({"detail": "Connection not found."}, status=status.HTTP_404_NOT_FOUND)

        job = FHIRExportJob.objects.create(
            connection=connection,
            resource_type=resource_type,
            patient_id=patient_id,
            status=SyncStatus.RUNNING,
            started_at=timezone.now(),
            triggered_by=request.user if request.user.is_authenticated else None,
        )

        IntegrationAuditEvent.objects.create(
            connection=connection,
            actor=request.user if request.user.is_authenticated else None,
            actor_username=request.user.username if request.user.is_authenticated else "System",
            action=IntegrationAuditEvent.Action.EXPORT_INITIATED,
            resource=f"FHIRExportJob:{job.id}",
            result="INITIATED",
            details={"resource_type": resource_type, "patient_id": str(patient_id) if patient_id else None},
        )

        # Execute export
        start_t = time.perf_counter()
        try:
            if resource_type == "Patient" and patient_id:
                OutboundExportService.export_patient(str(patient_id), endpoint=connection, sync_job=None, user=request.user)
                job.exported_records = 1
            elif resource_type == "Bundle" and patient_id:
                OutboundExportService.export_patient_bundle(str(patient_id), endpoint=connection, sync_job=None, user=request.user)
                job.exported_records = 1
            job.status = SyncStatus.COMPLETED
        except Exception as e:
            job.status = SyncStatus.FAILED
            job.failed_records = 1
            job.error_log = str(e)
        finally:
            job.duration_ms = round((time.perf_counter() - start_t) * 1000.0, 2)
            job.completed_at = timezone.now()
            job.save()

        IntegrationAuditEvent.objects.create(
            connection=connection,
            actor=request.user if request.user.is_authenticated else None,
            actor_username=request.user.username if request.user.is_authenticated else "System",
            action=IntegrationAuditEvent.Action.EXPORT_COMPLETED if job.status == SyncStatus.COMPLETED else IntegrationAuditEvent.Action.EXPORT_REJECTED,
            resource=f"FHIRExportJob:{job.id}",
            result=job.status,
            details={"exported_records": job.exported_records, "duration_ms": float(job.duration_ms)},
        )

        return Response(FHIRExportJobSerializer(job).data, status=status.HTTP_201_CREATED)


class FHIRResourceRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for inspecting raw FHIR resource snapshots.
    """
    queryset = FHIRResourceRecord.objects.all().select_related("connection").order_by("-created_at")
    serializer_class = FHIRResourceRecordSerializer
    permission_classes = [CanAccessInteroperability]


class FHIRMappingVersionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and updating versioned clinical field mappings.
    """
    queryset = FHIRMappingVersion.objects.all().order_by("-created_at")
    serializer_class = FHIRMappingVersionSerializer
    permission_classes = [CanAccessInteroperability]

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        IntegrationAuditEvent.objects.create(
            actor=self.request.user,
            actor_username=self.request.user.username,
            action=IntegrationAuditEvent.Action.MAPPING_MODIFIED,
            resource=f"FHIRMappingVersion:{obj.resource_type}:v{obj.version}",
            result="CREATED",
            details={"change_summary": obj.change_summary},
        )


class FHIRValidationResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for inspecting granular validation failures.
    """
    queryset = FHIRValidationResult.objects.all().order_by("-created_at")
    serializer_class = FHIRValidationResultSerializer
    permission_classes = [CanAccessInteroperability]


class PatientIdentityLinkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for inspecting and updating cross-institutional patient identity links.
    """
    queryset = PatientIdentityLink.objects.all().select_related("patient", "connection").order_by("-created_at")
    serializer_class = PatientIdentityLinkSerializer
    permission_classes = [CanAccessInteroperability]


class TerminologyMappingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing standard healthcare terminology translations.
    """
    queryset = TerminologyMapping.objects.all().select_related("connection").order_by("source_code")
    serializer_class = TerminologyMappingSerializer
    permission_classes = [CanAccessInteroperability]

    def perform_create(self, serializer):
        obj = serializer.save(verified_by=self.request.user)
        IntegrationAuditEvent.objects.create(
            actor=self.request.user,
            actor_username=self.request.user.username,
            action=IntegrationAuditEvent.Action.TERMINOLOGY_CHANGED,
            resource=f"Terminology:{obj.source_code}->{obj.target_code}",
            result="CREATED",
            details={"target_system": obj.target_system},
        )


class FHIRMappingConflictViewSet(viewsets.ModelViewSet):
    """
    Human Review Queue ViewSet for inspecting and resolving ambiguous mappings,
    duplicate matches, and overwrite protection triggers.
    """
    queryset = FHIRMappingConflict.objects.all().select_related("external_system", "assigned_to", "resolved_by").order_by("-created_at")
    serializer_class = FHIRMappingConflictSerializer
    permission_classes = [CanResolveConflicts]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        conflict_type = self.request.query_params.get("conflict_type")
        if conflict_type:
            qs = qs.filter(conflict_type=conflict_type)
        return qs

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Resolve a pending conflict."""
        conflict = self.get_object()
        serializer = ConflictResolutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_chosen = serializer.validated_data["action"]
        notes = serializer.validated_data.get("resolution_notes", "")

        resolved = ConflictService.resolve_conflict(
            conflict_id=str(conflict.id),
            action=action_chosen,
            reviewer_user=request.user,
            resolution_notes=notes,
        )

        IntegrationAuditEvent.objects.create(
            connection=conflict.external_system,
            actor=request.user,
            actor_username=request.user.username,
            action=IntegrationAuditEvent.Action.RECONCILIATION_DECISION,
            resource=f"Conflict:{conflict.id}",
            result=action_chosen,
            details={"notes": notes, "conflict_type": conflict.conflict_type},
        )

        return Response(FHIRMappingConflictSerializer(resolved).data, status=status.HTTP_200_OK)


class FHIRProvenanceRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for inspecting immutable provenance and cryptographic lineage.
    """
    queryset = FHIRProvenanceRecord.objects.all().select_related("external_system").order_by("-recorded_at")
    serializer_class = FHIRProvenanceRecordSerializer
    permission_classes = [CanAccessInteroperability]


class IntegrationAuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for inspecting immutable interoperability audit logs.
    """
    queryset = IntegrationAuditEvent.objects.all().select_related("connection", "actor").order_by("-timestamp")
    serializer_class = IntegrationAuditEventSerializer
    permission_classes = [CanAccessInteroperability]

    def get_queryset(self):
        qs = super().get_queryset()
        action_filter = self.request.query_params.get("action")
        if action_filter:
            qs = qs.filter(action=action_filter)
        resource_filter = self.request.query_params.get("resource")
        if resource_filter:
            qs = qs.filter(resource=resource_filter)
        result_filter = self.request.query_params.get("result")
        if result_filter:
            qs = qs.filter(result=result_filter)
        return qs


FHIRAuditLogViewSet = IntegrationAuditEventViewSet
