"""
Comprehensive test suite for Prompt 19: Role-Based Clinical Workspaces & Authorization.

Verifies:
- RBAC / ABAC permission boundaries across Doctor, Nurse, Informaticist, and IT Admin
- Prevention of horizontal and vertical privilege escalations
- Biological vital signs validation
- Human-in-the-loop clinical reviews and audit trail emission
- User administration without password disclosures
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import UserRole
from apps.clinical.models import ClinicalRecord, TriageRecord, TriageState
from apps.core.models import AuditLog
from apps.model_registry.models import ModelVersion
from apps.patients.models import Gender, Patient
from apps.predictions.models import ClinicalReview, Prediction, ReviewDecision, ReviewStatus, RiskLevel

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="test_dr_vance",
        email="dr.vance@test.hospital.org",
        password="TestPassword123!",
        role=UserRole.DOCTOR,
        first_name="Elena",
        last_name="Vance",
        department="Cardiology",
    )


@pytest.fixture
def nurse_user(db):
    return User.objects.create_user(
        username="test_nurse_jenkins",
        email="nurse.jenkins@test.hospital.org",
        password="TestPassword123!",
        role=UserRole.NURSE,
        first_name="Sarah",
        last_name="Jenkins",
        department="Emergency Triage",
    )


@pytest.fixture
def informaticist_user(db):
    return User.objects.create_user(
        username="test_analyst_rivera",
        email="analyst.rivera@test.hospital.org",
        password="TestPassword123!",
        role=UserRole.MEDICAL_INFORMATICIST,
        first_name="Alex",
        last_name="Rivera",
        department="Clinical Informatics",
    )


@pytest.fixture
def it_admin_user(db):
    return User.objects.create_user(
        username="test_it_admin",
        email="sysadmin@test.hospital.org",
        password="TestPassword123!",
        role=UserRole.IT_ADMIN,
        first_name="Marcus",
        last_name="Chen",
        department="IT Systems",
    )


@pytest.fixture
def sample_patient(db, doctor_user):
    return Patient.objects.create(
        mrn="MRN-TEST-1901",
        first_name="Robert",
        last_name="Taylor",
        date_of_birth="1958-04-12",
        gender=Gender.MALE,
        primary_physician=doctor_user,
    )


@pytest.fixture
def sample_model_version(db):
    return ModelVersion.objects.create(
        name="RandomForestClassifier",
        version="v1.0.0",
        algorithm="RandomForestClassifier",
        status="ACTIVE",
        metrics={"brier": 0.0027, "accuracy": 0.985},
        feature_names=["age", "systolic_bp", "st_depression"],
    )


@pytest.fixture
def sample_prediction(db, sample_patient, sample_model_version):
    return Prediction.objects.create(
        patient=sample_patient,
        model_version=sample_model_version,
        model_name="RandomForestClassifier",
        model_version_str="v1.0.0",
        prediction_result=RiskLevel.HIGH,
        probability=0.7420,
        inference_latency_ms=0.136,
        features_snapshot={"systolic_bp": 165, "st_depression": 2.2},
    )


@pytest.mark.django_db
class TestRolePermissions:
    """Security tests validating RBAC isolation across clinical roles."""

    def test_doctor_cannot_access_admin_users(self, api_client, doctor_user):
        """DOCTOR role must be rejected from administrative user management APIs."""
        api_client.force_authenticate(user=doctor_user)
        response = api_client.get("/api/v1/admin/users/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_nurse_cannot_perform_physician_review(self, api_client, nurse_user, sample_prediction):
        """NURSE role must not have authorization to record physician clinical reviews."""
        api_client.force_authenticate(user=nurse_user)
        payload = {
            "decision": ReviewDecision.CONCUR,
            "status": ReviewStatus.REVIEWED,
            "rationale": "Nurse concurring with prediction.",
        }
        response = api_client.post(f"/api/v1/predictions/reviews/{sample_prediction.id}/decision/", payload, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_informaticist_cannot_modify_clinical_vitals(self, api_client, informaticist_user, sample_patient):
        """MEDICAL_INFORMATICIST role must not enter or modify patient clinical vitals."""
        api_client.force_authenticate(user=informaticist_user)
        payload = {
            "patient_id": str(sample_patient.id),
            "systolic_bp": 130,
            "diastolic_bp": 85,
            "heart_rate": 78,
        }
        response = api_client.post("/api/v1/clinical/vitals/", payload, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_nurse_can_create_vitals_and_escalate(self, api_client, nurse_user, sample_patient, doctor_user):
        """NURSE can enter valid vitals and escalate deteriorating patient to doctor."""
        api_client.force_authenticate(user=nurse_user)

        # 1. Vital signs entry
        vitals_payload = {
            "patient_id": str(sample_patient.id),
            "systolic_bp": 168,
            "diastolic_bp": 104,
            "heart_rate": 118,
            "respiratory_rate": 22,
            "oxygen_saturation": 93.5,
            "body_temperature": 38.2,
        }
        res_vitals = api_client.post("/api/v1/clinical/vitals/", vitals_payload, format="json")
        assert res_vitals.status_code == status.HTTP_201_CREATED
        assert res_vitals.data["success"] is True

        # 2. Patient Escalation
        escalate_payload = {
            "patient_id": str(sample_patient.id),
            "reason": "Patient experiencing severe dyspnea, SpO2 down to 93%, SBP 168.",
            "priority": "HIGH",
            "doctor_id": str(doctor_user.id),
        }
        res_esc = api_client.post("/api/v1/clinical/triage/escalate/", escalate_payload, format="json")
        assert res_esc.status_code == status.HTTP_201_CREATED
        assert res_esc.data["success"] is True

    def test_vitals_biological_contradiction_rejected(self, api_client, nurse_user, sample_patient):
        """Vital signs violating physiology (SBP <= DBP) must be rejected with HTTP 400."""
        api_client.force_authenticate(user=nurse_user)
        bad_payload = {
            "patient_id": str(sample_patient.id),
            "systolic_bp": 80,
            "diastolic_bp": 120,  # Contradiction!
            "heart_rate": 80,
        }
        response = api_client.post("/api/v1/clinical/vitals/", bad_payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Biological contradiction" in response.data["error"]

    def test_doctor_can_record_clinical_review(self, api_client, doctor_user, sample_prediction):
        """DOCTOR can record clinical review decision with mandatory audit trail."""
        api_client.force_authenticate(user=doctor_user)
        payload = {
            "decision": ReviewDecision.OVERRIDE,
            "status": ReviewStatus.REVIEWED,
            "rationale": "Patient ST-elevation is artifact from movement tremor. Clinical status stable.",
            "override_risk_level": RiskLevel.MEDIUM,
        }
        response = api_client.post(f"/api/v1/predictions/reviews/{sample_prediction.id}/decision/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["decision"] == ReviewDecision.OVERRIDE

        # Verify audit log emission
        assert AuditLog.objects.filter(resource_type="ClinicalReview", user=doctor_user).exists()

    def test_informaticist_can_view_drift_and_model_metrics(self, api_client, informaticist_user):
        """MEDICAL_INFORMATICIST can inspect model performance benchmarks and drift telemetry."""
        api_client.force_authenticate(user=informaticist_user)

        res_bench = api_client.get("/api/v1/models/informatics/overview/")
        assert res_bench.status_code == status.HTTP_200_OK
        assert len(res_bench.data["data"]["model_benchmarks"]) >= 3

        res_drift = api_client.get("/api/v1/models/informatics/drift/")
        assert res_drift.status_code == status.HTTP_200_OK
        assert res_drift.data["data"]["overall_drift_status"] == "NORMAL"

    def test_admin_can_manage_user_status_without_password_leak(self, api_client, it_admin_user, nurse_user):
        """IT_ADMIN can toggle user activation, but API must NEVER return password hashes."""
        api_client.force_authenticate(user=it_admin_user)

        res_users = api_client.get("/api/v1/admin/users/")
        assert res_users.status_code == status.HTTP_200_OK
        for user_entry in res_users.data["data"]:
            assert "password" not in user_entry
            assert "password_hash" not in user_entry

        # Toggle activation
        res_toggle = api_client.post(f"/api/v1/admin/users/{nurse_user.id}/toggle-active/")
        assert res_toggle.status_code == status.HTTP_200_OK
        nurse_user.refresh_from_db()
        assert nurse_user.is_active is False
