"""
Unit Tests for Authoritative Overwrite Protection & Conflict Resolution.
"""
from datetime import date
from django.test import TestCase

from apps.accounts.models import User, UserRole
from apps.interoperability.application.conflict_service import ConflictService
from apps.interoperability.application.import_service import InboundImportService
from apps.interoperability.domain.enums import ConflictStatus, ConflictType, ResolutionAction
from apps.interoperability.models import FHIRMappingConflict
from apps.patients.models import Gender, Patient


class TestConflictResolution(TestCase):
    """Tests for human review queue and overwrite protection enforcement."""

    def setUp(self):
        self.patient = Patient.objects.create(
            mrn="MRN-OVERWRITE-001",
            first_name="Eleanor",
            last_name="Roosevelt",
            gender=Gender.FEMALE,
            date_of_birth=date(1984, 10, 11),
            phone_number="555-1111",
            email="eleanor@whitehouse.gov",
            address="1600 Pennsylvania Ave",
        )

        self.informaticist = User.objects.create_user(
            username="informaticist_mary",
            email="mary@healthnova.ai",
            first_name="Mary",
            last_name="Informaticist",
            role=UserRole.MEDICAL_INFORMATICIST,
        )

    def test_inbound_patient_conflict_created_not_overwritten(self):
        """Incoming conflicting data must NOT overwrite authoritative store without explicit human review."""
        incoming_fhir = {
            "resourceType": "Patient",
            "identifier": [{"system": "urn:oid:healthnova:mrn", "value": "MRN-OVERWRITE-001"}],
            "name": [{"family": "Roosevelt", "given": ["Eleanor"]}],
            "gender": "female",
            "birthDate": "1984-10-11",
            "telecom": [{"system": "phone", "value": "555-9999"}],  # Different phone!
            "address": [{"text": "Hyde Park Estate, NY"}],          # Different address!
        }

        outcome = InboundImportService.import_resource(
            payload=incoming_fhir,
            user=self.informaticist,
        )

        self.assertEqual(outcome["status"], "CONFLICT")
        self.assertIn("conflict_id", outcome)

        # Verify authoritative database record was NOT changed!
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.phone_number, "555-1111")
        self.assertEqual(self.patient.address, "1600 Pennsylvania Ave")

        # Verify pending conflict exists in queue
        conflict = FHIRMappingConflict.objects.get(id=outcome["conflict_id"])
        self.assertEqual(conflict.status, ConflictStatus.PENDING_REVIEW)
        self.assertEqual(conflict.conflict_type, ConflictType.OVERWRITE_PROTECTION_TRIGGERED)
        self.assertIn("phone_number", conflict.discrepancy_details)

    def test_resolve_conflict_overwrite_existing(self):
        """When human reviewer explicitly approves overwrite, authoritative store is updated."""
        incoming_fhir = {
            "resourceType": "Patient",
            "identifier": [{"system": "urn:oid:healthnova:mrn", "value": "MRN-OVERWRITE-001"}],
            "name": [{"family": "Roosevelt", "given": ["Eleanor"]}],
            "gender": "female",
            "birthDate": "1984-10-11",
            "telecom": [{"system": "phone", "value": "555-9999"}],
            "address": [{"text": "Hyde Park Estate, NY"}],
        }

        outcome = InboundImportService.import_resource(payload=incoming_fhir, user=self.informaticist)
        conflict_id = outcome["conflict_id"]

        # Human Informaticist resolves with OVERWRITE_EXISTING
        resolved = ConflictService.resolve_conflict(
            conflict_id=conflict_id,
            action=ResolutionAction.OVERWRITE_EXISTING,
            reviewer_user=self.informaticist,
            resolution_notes="Verified updated phone and residence with external hospital.",
        )

        self.assertEqual(resolved.status, ConflictStatus.APPROVED_APPLY)
        self.assertEqual(resolved.resolved_by, self.informaticist)

        # Now verify authoritative store WAS updated
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.phone_number, "555-9999")
        self.assertEqual(self.patient.address, "Hyde Park Estate, NY")

    def test_resolve_conflict_reject_incoming(self):
        """When human reviewer rejects, authoritative store remains untouched and conflict is marked REJECTED."""
        incoming_fhir = {
            "resourceType": "Patient",
            "identifier": [{"system": "urn:oid:healthnova:mrn", "value": "MRN-OVERWRITE-001"}],
            "name": [{"family": "Roosevelt", "given": ["Eleanor"]}],
            "gender": "female",
            "birthDate": "1984-10-11",
            "telecom": [{"system": "phone", "value": "555-0000"}],
        }

        outcome = InboundImportService.import_resource(payload=incoming_fhir, user=self.informaticist)
        conflict_id = outcome["conflict_id"]

        resolved = ConflictService.resolve_conflict(
            conflict_id=conflict_id,
            action=ResolutionAction.REJECT_INCOMING,
            reviewer_user=self.informaticist,
            resolution_notes="External record contains outdated contact number.",
        )

        self.assertEqual(resolved.status, ConflictStatus.REJECTED)
        self.patient.refresh_from_db()
        self.assertEqual(self.patient.phone_number, "555-1111")
