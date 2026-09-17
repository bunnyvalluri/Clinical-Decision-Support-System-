"""
5-Role Security Matrix Verification for Ruflo Orchestration Endpoints.
Tests:
- Patient / User: 403 on restricted agent workflows; access only to supervised patient portals.
- Doctor / Clinician: Authorized for patient evaluation, approvals, and knowledge queries.
- Nurse: Authorized for clinical observations, triage evaluations, and knowledge queries.
- Medical Informaticist: Authorized for drift analytics, evaluations, and task queues.
- IT Administrator: Authorized for system metrics, traces, and operational health.
"""
from datetime import date
from decimal import Decimal
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord
from apps.patients.models import Gender, Patient


@pytest.fixture
def auth_client():
    return APIClient()


@pytest.fixture
def test_roles(db):
    doctor = User.objects.create_user(
        username="doc_sec_test",
        email="doc.sec@hospital.org",
        password="SecurePassword123!",
        role=UserRole.CLINICIAN,
        first_name="Marcus",
        last_name="Welby",
        is_active=True,
    )
    nurse = User.objects.create_user(
        username="nurse_sec_test",
        email="nurse.sec@hospital.org",
        password="SecurePassword123!",
        role=UserRole.NURSE,
        first_name="Florence",
        last_name="Nightingale",
        is_active=True,
    )
    informaticist = User.objects.create_user(
        username="info_sec_test",
        email="info.sec@hospital.org",
        password="SecurePassword123!",
        role=UserRole.MEDICAL_INFORMATICIST,
        first_name="Claude",
        last_name="Shannon",
        is_active=True,
    )
    admin = User.objects.create_user(
        username="admin_sec_test",
        email="admin.sec@hospital.org",
        password="SecurePassword123!",
        role=UserRole.IT_ADMIN,
        first_name="Grace",
        last_name="Hopper",
        is_staff=True,
        is_active=True,
    )
    patient = User.objects.create_user(
        username="patient_sec_test",
        email="patient.sec@hospital.org",
        password="SecurePassword123!",
        role=UserRole.PATIENT,
        first_name="Alice",
        last_name="Smith",
        is_active=True,
    )
    return {
        "doctor": doctor,
        "nurse": nurse,
        "informaticist": informaticist,
        "admin": admin,
        "patient": patient,
    }


@pytest.fixture
def sample_patient(db, test_roles):
    p = Patient.objects.create(
        mrn="MRN-SEC-101",
        first_name="Bob",
        last_name="Taylor",
        date_of_birth=date(1968, 4, 20),
        gender=Gender.MALE,
        primary_physician=test_roles["doctor"],
    )
    ClinicalRecord.objects.create(
        patient=p,
        recorded_by=test_roles["nurse"],
        systolic_bp=135,
        diastolic_bp=85,
        heart_rate=78,
        respiratory_rate=16,
        body_temperature=Decimal("37.0"),
        oxygen_saturation=Decimal("98.0"),
    )
    return p


@pytest.mark.django_db
class TestFiveRolePermissionMatrix:
    def test_unauthenticated_request_blocked_401(self, auth_client, sample_patient):
        res = auth_client.post(
            "/api/v1/ai/swarm/evaluate/",
            {"patient_id": str(sample_patient.id)},
            format="json",
        )
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_patient_forbidden_from_swarm_evaluation_403(self, auth_client, test_roles, sample_patient):
        auth_client.force_authenticate(user=test_roles["patient"])
        res = auth_client.post(
            "/api/v1/ai/swarm/evaluate/",
            {"patient_id": str(sample_patient.id)},
            format="json",
        )
        assert res.status_code == status.HTTP_403_FORBIDDEN
        assert "not authorized" in res.data["error"]

    def test_doctor_authorized_for_swarm_evaluation_200(self, auth_client, test_roles, sample_patient):
        auth_client.force_authenticate(user=test_roles["doctor"])
        res = auth_client.post(
            "/api/v1/ai/swarm/evaluate/",
            {"patient_id": str(sample_patient.id)},
            format="json",
        )
        assert res.status_code == status.HTTP_200_OK
        assert "workflow_id" in res.data
        assert "safety_verdict" in res.data

    def test_nurse_authorized_for_swarm_evaluation_200(self, auth_client, test_roles, sample_patient):
        auth_client.force_authenticate(user=test_roles["nurse"])
        res = auth_client.post(
            "/api/v1/ai/swarm/evaluate/",
            {"patient_id": str(sample_patient.id)},
            format="json",
        )
        assert res.status_code == status.HTTP_200_OK

    def test_informaticist_authorized_for_metrics_and_drift_200(self, auth_client, test_roles):
        auth_client.force_authenticate(user=test_roles["informaticist"])
        metrics_res = auth_client.get("/api/v1/ai/metrics/")
        assert metrics_res.status_code == status.HTTP_200_OK
        assert "ruflo_version" in metrics_res.data
        assert metrics_res.data["ruflo_version"] == "3.42.0"

        drift_res = auth_client.get("/api/v1/ai/drift/")
        assert drift_res.status_code == status.HTTP_200_OK

    def test_admin_authorized_for_task_and_agent_registries_200(self, auth_client, test_roles):
        auth_client.force_authenticate(user=test_roles["admin"])
        agents_res = auth_client.get("/api/v1/ai/agents/")
        assert agents_res.status_code == status.HTTP_200_OK
        assert agents_res.data["topology"] == "hierarchical"

        tools_res = auth_client.get("/api/v1/ai/tools/")
        assert tools_res.status_code == status.HTTP_200_OK

        tasks_res = auth_client.get("/api/v1/ai/tasks/")
        assert tasks_res.status_code == status.HTTP_200_OK
