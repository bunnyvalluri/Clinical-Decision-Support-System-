"""
URL Configuration for HealthNova AI Interoperability Subsystem (/api/v1/interoperability/).
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ExternalSystemViewSet,
    FHIRCapabilityStatementView,
    FHIRExportJobViewSet,
    FHIRImportJobViewSet,
    FHIRMappingConflictViewSet,
    FHIRMappingVersionViewSet,
    FHIRPatientEverythingView,
    FHIRProvenanceRecordViewSet,
    FHIRResourceBoundaryMatrixView,
    FHIRResourceRecordViewSet,
    FHIRResourceView,
    FHIRValidationResultViewSet,
    InformaticistDashboardMetricsView,
    IntegrationAuditEventViewSet,
    IntegrationConnectionViewSet,
    PatientIdentityLinkViewSet,
    TerminologyMappingViewSet,
)

router = DefaultRouter()
router.register(r"systems", ExternalSystemViewSet, basename="external-system")
router.register(r"connections", IntegrationConnectionViewSet, basename="integration-connection")
router.register(r"endpoints", IntegrationConnectionViewSet, basename="fhir-endpoint")  # compat alias
router.register(r"imports", FHIRImportJobViewSet, basename="fhir-import-job")
router.register(r"sync/jobs", FHIRImportJobViewSet, basename="fhir-sync-job")  # compat alias
router.register(r"exports", FHIRExportJobViewSet, basename="fhir-export-job")
router.register(r"resources", FHIRResourceRecordViewSet, basename="fhir-resource-record")
router.register(r"mappings", FHIRMappingVersionViewSet, basename="fhir-mapping-version")
router.register(r"validations", FHIRValidationResultViewSet, basename="fhir-validation-result")
router.register(r"identities", PatientIdentityLinkViewSet, basename="patient-identity-link")
router.register(r"terminology", TerminologyMappingViewSet, basename="terminology-mapping")
router.register(r"conflicts", FHIRMappingConflictViewSet, basename="fhir-conflict")
router.register(r"reconciliation", FHIRMappingConflictViewSet, basename="fhir-reconciliation")
router.register(r"provenance", FHIRProvenanceRecordViewSet, basename="fhir-provenance")
router.register(r"audit", IntegrationAuditEventViewSet, basename="integration-audit")

app_name = "interoperability"

urlpatterns = [
    # Dashboard & Boundary Matrix
    path("status/", InformaticistDashboardMetricsView.as_view(), name="interoperability-status"),
    path("dashboard/metrics/", InformaticistDashboardMetricsView.as_view(), name="informaticist-dashboard-metrics"),
    path("matrix/", FHIRResourceBoundaryMatrixView.as_view(), name="resource-boundary-matrix"),

    # Direct FHIR R4 standard sub-paths under API
    path("fhir/r4/metadata", FHIRCapabilityStatementView.as_view(), name="fhir-metadata"),
    path("fhir/r4/metadata/", FHIRCapabilityStatementView.as_view(), name="fhir-metadata-slash"),
    path("fhir/r4/Patient/<str:patient_id>/$everything", FHIRPatientEverythingView.as_view(), name="fhir-patient-everything"),
    path("fhir/r4/<str:resource_type>/<str:resource_id>", FHIRResourceView.as_view(), name="fhir-resource-instance"),
    path("fhir/r4/<str:resource_type>/<str:resource_id>/", FHIRResourceView.as_view(), name="fhir-resource-instance-slash"),
    path("fhir/r4/<str:resource_type>", FHIRResourceView.as_view(), name="fhir-resource-type"),
    path("fhir/r4/<str:resource_type>/", FHIRResourceView.as_view(), name="fhir-resource-type-slash"),
    path("fhir/r4/", FHIRResourceView.as_view(), name="fhir-bundle-root"),

    # Management Router
    path("", include(router.urls)),
]
