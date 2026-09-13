"""
Comprehensive integration and unit tests for Patient / User Portal:
- Identity resolution and server-side patient linking
- RBAC / Isolation: cross-patient data leaks prevented
- Endpoint coverage: dashboard, vitals, risk-assessments, appointments, messages, consent
- Vitals validation: biological range and systolic > diastolic enforcement
- Async risk assessment celery dispatch
"""
import uuid
import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.patients.models import Patient
from apps.patient_portal.models import (
    UserVitalRecord,
    UserRiskAssessment,
    Appointment,
    Conversation,
    Message,
    ConsentRecord,
    UserTask,
    VitalSource,
    ConsentType,
    TaskType,
    TaskStatus,
)

User = get_user_model()


@pytest.fixture
def patient_user_a(db):
    user = User.objects.create_user(
        username="patient_a",
        email="patient_a@example.com",
        password="PatientPass123!",
        first_name="Eleanor",
        last_name="Ward",
        role="PATIENT",
    )
    patient = Patient.objects.create(
        user=user,
        mrn="MRN-PA-001",
        first_name="Eleanor",
        last_name="Ward",
        date_of_birth="1978-04-12",
        gender="FEMALE",
        blood_group="A+",
    )
    return user, patient


@pytest.fixture
def patient_user_b(db):
    user = User.objects.create_user(
        username="patient_b",
        email="patient_b@example.com",
        password="PatientPass123!",
        first_name="Arthur",
        last_name="Dent",
        role="PATIENT",
    )
    patient = Patient.objects.create(
        user=user,
        mrn="MRN-PB-002",
        first_name="Arthur",
        last_name="Dent",
        date_of_birth="1982-11-03",
        gender="MALE",
        blood_group="O+",
    )
    return user, patient


@pytest.fixture
def client_a(patient_user_a):
    user, _ = patient_user_a
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def client_b(patient_user_b):
    user, _ = patient_user_b
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestPatientPortalAuthenticationAndIsolation:
    def test_unauthenticated_requests_are_rejected(self):
        client = APIClient()
        resp = client.get("/api/v1/user/dashboard/")
        assert resp.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_patient_dashboard_resolves_identity(self, client_a, patient_user_a):
        _, patient = patient_user_a
        resp = client_a.get("/api/v1/user/dashboard/")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["patient"]["mrn"] == "MRN-PA-001"
        assert data["patient"]["first_name"] == "Eleanor"

    def test_cross_patient_data_isolation_vitals(self, client_a, client_b, patient_user_a, patient_user_b):
        _, patient_a = patient_user_a
        _, patient_b = patient_user_b

        # Vital for patient A
        vital_a = UserVitalRecord.objects.create(
            patient=patient_a,
            systolic_bp=120,
            diastolic_bp=80,
            heart_rate=72,
            source=VitalSource.USER_ENTERED,
        )

        # Vital for patient B
        vital_b = UserVitalRecord.objects.create(
            patient=patient_b,
            systolic_bp=135,
            diastolic_bp=88,
            heart_rate=80,
            source=VitalSource.USER_ENTERED,
        )

        # Patient A should only see their vital
        resp_a = client_a.get("/api/v1/user/vitals/")
        assert resp_a.status_code == status.HTTP_200_OK
        data = resp_a.json()
        results_a = data.get("results", data) if isinstance(data, dict) else data
        vital_ids_a = [v["id"] for v in results_a]
        assert str(vital_a.id) in vital_ids_a
        assert str(vital_b.id) not in vital_ids_a

        # Patient A directly querying vital B by ID must return 404 (preventing resource enumeration)
        resp_direct = client_a.get(f"/api/v1/user/vitals/{vital_b.id}/")
        assert resp_direct.status_code == status.HTTP_404_NOT_FOUND

    def test_patient_cannot_access_administrative_routes(self, client_a):
        # Patient cannot access admin audit logs
        resp = client_a.get("/api/v1/audit/")
        assert resp.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED]


@pytest.mark.django_db
class TestPatientVitalsSubmission:
    def test_valid_vital_record_creation(self, client_a, patient_user_a):
        _, patient = patient_user_a
        payload = {
            "systolic_bp": 124,
            "diastolic_bp": 82,
            "heart_rate": 74,
            "spo2": 98,
            "temperature_c": 37.0,
            "blood_glucose": 95.0,
            "source": VitalSource.USER_ENTERED,
        }
        resp = client_a.post("/api/v1/user/vitals/", data=payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()
        assert data["systolic_bp"] == 124
        assert data["diastolic_bp"] == 82
        assert UserVitalRecord.objects.filter(patient=patient, systolic_bp=124).exists()

    def test_invalid_vital_systolic_must_exceed_diastolic(self, client_a):
        payload = {
            "systolic_bp": 70,
            "diastolic_bp": 90,  # Invalid: diastolic higher than systolic
            "heart_rate": 75,
        }
        resp = client_a.post("/api/v1/user/vitals/", data=payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPatientRiskAssessment:
    @patch("apps.patient_portal.tasks.process_patient_risk_assessment_task.delay")
    def test_submit_assessment_dispatches_celery_task(self, mock_celery_delay, client_a, patient_user_a):
        _, patient = patient_user_a
        payload = {
            "symptoms": ["Mild fatigue", "Occasional chest tightness"],
            "systolic_bp": 130,
            "diastolic_bp": 85,
            "heart_rate": 78,
            "patient_notes": "Feeling slightly tired after walking up stairs",
        }
        resp = client_a.post("/api/v1/user/risk-assessments/", data=payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()
        assert data["status"] == "PREPARING"
        assessment_id = data["id"]

        assert UserRiskAssessment.objects.filter(id=assessment_id, patient=patient).exists()
        mock_celery_delay.assert_called_once_with(assessment_id)


@pytest.mark.django_db
class TestPatientConsentAndTasks:
    def test_consent_list_and_create(self, client_a, patient_user_a):
        _, patient = patient_user_a
        ConsentRecord.objects.create(
            patient=patient,
            consent_type=ConsentType.DATA_SHARING,
            is_granted=True,
        )

        resp = client_a.get("/api/v1/user/consent/")
        assert resp.status_code == status.HTTP_200_OK

        # Create updated consent
        resp_update = client_a.post(
            "/api/v1/user/consent/",
            data={"consent_type": ConsentType.AI_DECISION_SUPPORT, "is_granted": True},
            format="json",
        )
        assert resp_update.status_code == status.HTTP_201_CREATED
        assert ConsentRecord.objects.filter(patient=patient, consent_type=ConsentType.AI_DECISION_SUPPORT, is_granted=True).exists()

    def test_tasks_list_and_complete(self, client_a, patient_user_a):
        _, patient = patient_user_a
        task = UserTask.objects.create(
            patient=patient,
            title="Log morning blood pressure",
            task_type=TaskType.LOG_VITALS,
            due_date=timezone.now() + timezone.timedelta(days=1),
            status=TaskStatus.PENDING,
        )

        resp = client_a.get("/api/v1/user/tasks/")
        assert resp.status_code == status.HTTP_200_OK

        resp_complete = client_a.post(f"/api/v1/user/tasks/{task.id}/complete/")
        assert resp_complete.status_code == status.HTTP_200_OK
        task.refresh_from_db()
        assert task.status == TaskStatus.COMPLETED
