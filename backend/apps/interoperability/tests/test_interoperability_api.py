"""
Integration & API Tests for FHIR R4 and Interoperability Endpoints.
"""
from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, UserRole
from apps.interoperability.domain.enums import ConflictStatus, ConflictType, ResolutionAction
from apps.interoperability.models import FHIREndpoint, FHIRMappingConflict
from apps.patients.models import Gender, Patient


class TestInteroperabilityAPI(APITestCase):
    """Tests for FHIR R4 API endpoints and administrative views."""

    def setUp(self):
        self.patient = Patient.objects.create(
            mrn="MRN-API-001",
            first_name="Grace",
            last_name="Hopper",
            gender=Gender.FEMALE,
            date_of_birth=date(1982, 12, 9),
        )

        self.admin = User.objects.create_user(
            username="admin_grace",
            email="admin.grace@healthnova.ai",
            role=UserRole.IT_ADMIN,
        )

        self.informaticist = User.objects.create_user(
            username="info_grace",
            email="info.grace@healthnova.ai",
            role=UserRole.MEDICAL_INFORMATICIST,
        )

        self.nurse = User.objects.create_user(
            username="nurse_florence",
            email="florence@healthnova.ai",
            role=UserRole.NURSE,
        )

    def test_capability_statement_metadata(self):
        """Publicly accessible metadata CapabilityStatement."""
        url = "/fhir/r4/metadata"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("resourceType"), "CapabilityStatement")
        self.assertEqual(resp.data.get("fhirVersion"), "4.0.1")

    def test_get_patient_fhir_resource(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/fhir/r4/Patient/{self.patient.id}"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("resourceType"), "Patient")
        self.assertEqual(resp.data.get("id"), str(self.patient.id))

    def test_post_patient_fhir_resource(self):
        self.client.force_authenticate(user=self.admin)
        url = "/fhir/r4/Patient"
        payload = {
            "resourceType": "Patient",
            "identifier": [{"system": "urn:oid:healthnova:mrn", "value": "MRN-API-NEW-999"}],
            "name": [{"family": "Curie", "given": ["Marie"]}],
            "gender": "female",
            "birthDate": "1975-11-07",
        }
        resp = self.client.post(url, data=payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data.get("status"), "CREATED")
        self.assertTrue(Patient.objects.filter(mrn="MRN-API-NEW-999").exists())

    def test_patient_everything_operation(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/fhir/r4/Patient/{self.patient.id}/$everything"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("resourceType"), "Bundle")
        self.assertTrue(resp.data.get("total") >= 1)

    def test_interoperability_status_dashboard(self):
        self.client.force_authenticate(user=self.admin)
        url = "/api/v1/interoperability/status/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("total_endpoints", resp.data)
        self.assertIn("pending_conflicts", resp.data)
        self.assertIn("success_rate_percent", resp.data)

    def test_resource_boundary_matrix(self):
        self.client.force_authenticate(user=self.informaticist)
        url = "/api/v1/interoperability/matrix/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get("fhir_version"), "4.0.1")
        resources = resp.data.get("resources", [])
        self.assertTrue(any(r["resource"] == "Patient" and r["status"] == "SUPPORTED" for r in resources))
        self.assertTrue(any(r["resource"] == "Medication" and r["status"] == "PLANNED" for r in resources))

    def test_resolve_conflict_endpoint(self):
        conflict = FHIRMappingConflict.objects.create(
            conflict_type=ConflictType.OVERWRITE_PROTECTION_TRIGGERED,
            resource_type="Patient",
            incoming_payload={"resourceType": "Patient", "name": [{"family": "Hopper", "given": ["Grace"]}]},
            existing_entity_type="Patient",
            existing_entity_id=str(self.patient.id),
        )

        self.client.force_authenticate(user=self.informaticist)
        url = f"/api/v1/interoperability/conflicts/{conflict.id}/resolve/"
        resp = self.client.post(
            url,
            data={"action": ResolutionAction.MERGE_RECORDS, "resolution_notes": "Approved merge."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        conflict.refresh_from_db()
        self.assertEqual(conflict.status, ConflictStatus.APPROVED_APPLY)

    def test_rbac_restrictions(self):
        """Nurse cannot access administrative interoperability status."""
        self.client.force_authenticate(user=self.nurse)
        url = "/api/v1/interoperability/status/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
