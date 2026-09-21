"""
Direct FHIR R4 Endpoint URL Configuration (/fhir/r4/).
Allows external EHRs to interact directly with standard FHIR paths.
"""
from django.urls import path
from .views import (
    FHIRCapabilityStatementView,
    FHIRPatientEverythingView,
    FHIRResourceView,
)

urlpatterns = [
    path("metadata", FHIRCapabilityStatementView.as_view(), name="fhir-direct-metadata"),
    path("metadata/", FHIRCapabilityStatementView.as_view(), name="fhir-direct-metadata-slash"),
    path("Patient/<str:patient_id>/$everything", FHIRPatientEverythingView.as_view(), name="fhir-direct-patient-everything"),
    path("<str:resource_type>/<str:resource_id>", FHIRResourceView.as_view(), name="fhir-direct-resource-instance"),
    path("<str:resource_type>/<str:resource_id>/", FHIRResourceView.as_view(), name="fhir-direct-resource-instance-slash"),
    path("<str:resource_type>", FHIRResourceView.as_view(), name="fhir-direct-resource-type"),
    path("<str:resource_type>/", FHIRResourceView.as_view(), name="fhir-direct-resource-type-slash"),
    path("", FHIRResourceView.as_view(), name="fhir-direct-bundle-root"),
]
