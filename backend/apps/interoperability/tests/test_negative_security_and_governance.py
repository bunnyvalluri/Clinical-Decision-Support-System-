"""
Negative Security, Role Authorization, and Clinical Governance Tests — BPY-CSE-2666 (Section 37).
"""
from datetime import date
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord, EncounterType
from apps.interoperability.ai_boundary import FHIRAIBoundaryGate
from apps.interoperability.domain.exceptions import (
    ClinicalBoundsViolationError,
    FHIRSecurityError,
    InteroperabilityError,
)
from apps.interoperability.ml_boundary import FHIRMLBoundaryGate
from apps.interoperability.models import IntegrationConnection, IntegrationHealthStatus
from apps.interoperability.tests.fixtures.synthetic_fixtures import (
    SYNTHETIC_INJECTION_PAYLOAD,
    SYNTHETIC_INVALID_OBSERVATION,
    SYNTHETIC_INVALID_PATIENT,
    SYNTHETIC_VALID_PATIENT,
)
from apps.interoperability.validators.security_sanitizer import SecuritySanitizer
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.patients.models import Gender, Patient


class TestNegativeSecurityAndGovernance(APITestCase):
    """Negative tests for security, RBAC enforcement, and clinical boundaries."""

    def setUp(self):
        self.patient = Patient.objects.create(
            mrn="MRN-SEC-001",
            first_name="Ada",
            last_name="Lovelace",
            gender=Gender.FEMALE,
            date_of_birth=date(1990, 12, 10),
        )

        self.doctor = User.objects.create_user(
            username="dr_watson",
            email="watson@healthnova.ai",
            role=UserRole.DOCTOR,
        )

        self.nurse = User.objects.create_user(
            username="nurse_nightingale",
            email="nightingale@healthnova.ai",
            role=UserRole.NURSE,
        )

        self.informaticist = User.objects.create_user(
            username="info_shannon",
            email="shannon@healthnova.ai",
            role=UserRole.MEDICAL_INFORMATICIST,
        )

        self.admin = User.objects.create_user(
            username="admin_turing",
            email="turing@healthnova.ai",
            role=UserRole.IT_ADMIN,
        )

        self.connection = IntegrationConnection.objects.create(
            name="City General Hospital",
            base_url="https://citygeneral.org/fhir/r4",
            fhir_version="4.0.1",
            health_status=IntegrationHealthStatus.NOT_CONFIGURED,
        )

    def test_nurse_cannot_modify_mapping(self):
        """Nurse lacks permission to create or modify clinical field mappings."""
        self.client.force_authenticate(user=self.nurse)
        url = "/api/v1/interoperability/mappings/"
        payload = {
            "resource_type": "Observation",
            "version": "1.0.1",
            "mapping_rules": {"rule": "test"},
        }
        resp = self.client.post(url, data=payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_nurse_cannot_access_interoperability_connections(self):
        """Nurse is forbidden from viewing integration connections."""
        self.client.force_authenticate(user=self.nurse)
        url = "/api/v1/interoperability/connections/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_access_rejected(self):
        """Unauthenticated requests to manage connections or status are rejected."""
        url = "/api/v1/interoperability/status/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_prompt_injection_in_payload_blocked(self):
        """Incoming FHIR payload with malicious prompt injection is blocked immediately."""
        self.client.force_authenticate(user=self.admin)
        url = "/fhir/r4/Observation"
        resp = self.client.post(url, data=SYNTHETIC_INJECTION_PAYLOAD, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Security violation", str(resp.data))

    def test_oversized_bundle_rejected(self):
        """Bundles exceeding MAX_BUNDLE_ENTRIES (500) are blocked to prevent DoS."""
        oversized_bundle = {
            "resourceType": "Bundle",
            "type": "collection",
            "entry": [{"resource": {"resourceType": "Observation"}} for _ in range(501)],
        }
        with self.assertRaises(FHIRSecurityError):
            SecuritySanitizer.sanitize_payload(oversized_bundle)

    def test_deeply_nested_json_bomb_rejected(self):
        """Deeply nested payload exceeding recursion limit is blocked."""
        nested = {"a": {}}
        curr = nested["a"]
        for _ in range(25):
            curr["b"] = {}
            curr = curr["b"]
        with self.assertRaises(FHIRSecurityError):
            SecuritySanitizer.sanitize_payload(nested)

    def test_ml_boundary_rejects_physiologically_invalid_vitals(self):
        """Raw unvalidated or out-of-bounds vitals must NEVER enter ML model input."""
        invalid_record = ClinicalRecord.objects.create(
            patient=self.patient,
            systolic_bp=350,  # Physiologically impossible
            diastolic_bp=60,
            encounter_type=EncounterType.OUTPATIENT,
        )
        model_ver = ModelVersion.objects.create(
            model_name="RiskModel",
            version="1.0.0",
            algorithm="RandomForestClassifier",
            status=ModelStatus.PRODUCTION,
            artifact_location="models/risk_v100.pkl",
            training_dataset_identifier="mimic_iv_synthetic",
            feature_schema_version="1.0.0",
            preprocessing_version="1.0.0",
        )
        with self.assertRaises(ClinicalBoundsViolationError):
            FHIRMLBoundaryGate.prepare_and_validate_features(invalid_record, model_ver)

    def test_ai_boundary_blocks_autonomous_medical_decisions(self):
        """AI is strictly prohibited from autonomously modifying records, merging patients, or diagnosing."""
        with self.assertRaises(InteroperabilityError):
            FHIRAIBoundaryGate.assert_action_permitted("MODIFY_CLINICAL_RECORD")

        with self.assertRaises(InteroperabilityError):
            FHIRAIBoundaryGate.assert_action_permitted("MERGE_PATIENTS")

        with self.assertRaises(InteroperabilityError):
            FHIRAIBoundaryGate.assert_action_permitted("AUTONOMOUS_DIAGNOSIS")

        with self.assertRaises(InteroperabilityError):
            FHIRAIBoundaryGate.assert_action_permitted("AUTONOMOUS_PRESCRIPTION")
