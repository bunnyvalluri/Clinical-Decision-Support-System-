"""
Unit Tests for FHIR Provenance & Audit Logging.
"""
from datetime import date
from django.test import TestCase

from apps.accounts.models import User, UserRole
from apps.clinical.models import PatientTimelineEvent
from apps.interoperability.audit.fhir_audit_logger import FHIRAuditLogger
from apps.interoperability.models import FHIREndpoint, FHIRProvenanceRecord, FHIRAuditLog
from apps.interoperability.provenance.provenance_tracker import ProvenanceTracker
from apps.patients.models import Gender, Patient


class TestProvenanceAndAudit(TestCase):
    """Tests for cryptographic provenance hashing and audit trails."""

    def setUp(self):
        self.patient = Patient.objects.create(
            mrn="MRN-PROV-001",
            first_name="Ada",
            last_name="Lovelace",
            gender=Gender.FEMALE,
            date_of_birth=date(1990, 12, 10),
        )

        self.endpoint = FHIREndpoint.objects.create(
            name="St. Mary's Regional Hospital",
            base_url="https://stmarys.org/fhir/r4",
            fhir_version="4.0.1",
        )

        self.user = User.objects.create_user(
            username="admin_ada",
            email="ada@healthnova.ai",
            role=UserRole.IT_ADMIN,
        )

    def test_sha256_payload_hash_deterministic(self):
        payload = {"resourceType": "Patient", "id": "123", "active": True}
        hash1 = ProvenanceTracker.compute_payload_hash(payload)
        hash2 = ProvenanceTracker.compute_payload_hash(payload)
        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 64)

    def test_record_inbound_provenance_and_timeline_event(self):
        payload = {
            "resourceType": "Patient",
            "id": "ext-ada-101",
            "name": [{"family": "Lovelace", "given": ["Ada"]}],
        }

        prov = ProvenanceTracker.record_inbound_provenance(
            entity_type="Patient",
            entity_id=str(self.patient.id),
            fhir_resource=payload,
            endpoint=self.endpoint,
            patient_id=str(self.patient.id),
        )

        self.assertIsNotNone(prov.id)
        self.assertEqual(prov.external_system_name, "St. Mary's Regional Hospital")
        self.assertEqual(prov.external_resource_id, "ext-ada-101")
        self.assertEqual(len(prov.payload_sha256), 64)

        # Verify Patient Timeline event was created
        timeline_event = PatientTimelineEvent.objects.filter(
            patient=self.patient,
            source="FHIR_Interoperability",
        ).first()
        self.assertIsNotNone(timeline_event)
        self.assertIn("FHIR R4 Ingestion", timeline_event.title)

    def test_audit_logger_records_transaction(self):
        log_entry = FHIRAuditLogger.log_transaction(
            direction="INBOUND",
            operation="POST /Observation",
            status_code=201,
            is_success=True,
            resource_type="Observation",
            endpoint=self.endpoint,
            user=self.user,
            details={"observation_type": "vital-signs"},
        )

        self.assertIsNotNone(log_entry.id)
        self.assertEqual(log_entry.direction, "INBOUND")
        self.assertEqual(log_entry.operation, "POST /Observation")
        self.assertEqual(log_entry.status_code, 201)
        self.assertTrue(log_entry.is_success)
        self.assertEqual(log_entry.user, self.user)
