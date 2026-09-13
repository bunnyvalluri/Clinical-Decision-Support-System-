"""
Tests for PredictionService and Prediction REST APIs.
Validates real-time inference latency, batch throughput, explainability attributions,
clinician override auditing, and RBAC security.
"""
from datetime import date
from decimal import Decimal
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord
from apps.core.models import AuditLog
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.patients.models import Patient
from apps.predictions.models import Prediction, PredictionExplanation, RiskLevel
from services.model_loader import ModelLoaderService, NoActiveModelError
from services.prediction_service import (
    MissingClinicalDataError,
    PatientNotFoundError,
    PredictionService,
)


@pytest.fixture
def auth_client():
    return APIClient()


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="doc_house",
        email="attending.doc@hospital.org",
        password="SecureDocPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Gregory",
        last_name="House",
        is_active=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="john_doe",
        email="john.doe.patient@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="John",
        last_name="Doe",
        is_active=True,
    )


@pytest.fixture
def other_patient_user(db):
    return User.objects.create_user(
        username="jane_smith",
        email="jane.smith.patient@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="Jane",
        last_name="Smith",
        is_active=True,
    )


@pytest.fixture(autouse=True)
def setup_active_model(db):
    """Ensure an active model exists in the test database for all prediction tests."""
    ModelLoaderService.invalidate_cache()
    model = ModelVersion.objects.create(
        model_name="random_forest_risk_model",
        algorithm="Random Forest",
        version="1.0.0",
        status=ModelStatus.ACTIVE,
        accuracy=Decimal("1.0000"),
        artifact_location="ml/artifacts/models/random_forest_risk_model/1.0.0/pipeline.joblib",
    )
    yield model
    ModelLoaderService.invalidate_cache()


@pytest.fixture
def test_patient(db, patient_user):
    return Patient.objects.create(
        user=patient_user,
        mrn="MRN-TEST-PRED-001",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1975, 6, 15),
        gender="MALE",
        blood_group="O_POS",
    )


@pytest.fixture
def other_patient(db, other_patient_user):
    return Patient.objects.create(
        user=other_patient_user,
        mrn="MRN-TEST-PRED-002",
        first_name="Jane",
        last_name="Smith",
        date_of_birth=date(1988, 3, 22),
        gender="FEMALE",
        blood_group="A_POS",
    )


@pytest.fixture
def clinical_vitals_record(db, test_patient, doctor_user):
    return ClinicalRecord.objects.create(
        patient=test_patient,
        recorded_by=doctor_user,
        encounter_type="INPATIENT",
        heart_rate=105,
        respiratory_rate=24,
        body_temperature=Decimal("38.6"),
        oxygen_saturation=Decimal("92.0"),
        systolic_bp=155,
        diastolic_bp=95,
        glucose_level=Decimal("175.0"),
        cholesterol_total=Decimal("220.0"),
        creatinine=Decimal("1.60"),
        sodium=Decimal("138.0"),
        calcium=Decimal("9.1"),
        lactic_acid=Decimal("2.40"),
        bmi=Decimal("28.4"),
    )


@pytest.fixture
def sample_vitals_dict():
    return {
        "heart_rate": 110,
        "respiratory_rate": 26,
        "temperature": 39.1,
        "oxygen_saturation": 91,
        "systolic_bp": 160,
        "diastolic_bp": 100,
        "glucose": 185.0,
        "cholesterol": 210.0,
        "creatinine": 1.8,
        "sodium": 136.0,
        "calcium": 9.0,
        "lactic_acid": 2.8,
        "bmi": 29.2,
    }


@pytest.mark.django_db
class TestPredictionService:
    """Unit tests for the PredictionService business logic layer."""

    def test_predict_patient_from_clinical_record(self, test_patient, clinical_vitals_record, doctor_user):
        """Verify real-time prediction derives from latest encounter vitals with valid explanation."""
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            requested_by=doctor_user,
        )

        assert prediction is not None
        assert prediction.patient_id == test_patient.id
        assert prediction.clinical_record_id == clinical_vitals_record.id
        assert prediction.prediction_result in RiskLevel.values
        assert 0.0 <= float(prediction.probability) <= 1.0
        assert 0.0 <= float(prediction.confidence_score) <= 1.0
        assert float(prediction.inference_latency_ms) >= 0.0

        # Verify explanation was created
        explanation = prediction.explanation
        assert explanation is not None
        assert len(explanation.feature_importances) > 0
        assert isinstance(explanation.top_risk_factors, list)

    def test_predict_patient_with_explicit_vitals(self, test_patient, sample_vitals_dict, doctor_user):
        """Verify real-time prediction using direct on-the-fly vitals payload."""
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            vitals=sample_vitals_dict,
            requested_by=doctor_user,
        )

        assert prediction.prediction_result in RiskLevel.values
        assert prediction.features_snapshot["heart_rate"] == 110.0
        assert prediction.features_snapshot["oxygen_saturation"] == 91.0

    def test_missing_clinical_data_raises_error(self, other_patient, doctor_user):
        """Verify exception is raised if patient has no vitals and none provided."""
        service = PredictionService()
        with pytest.raises(MissingClinicalDataError):
            service.predict_patient(patient_id=other_patient.id, requested_by=doctor_user)

    def test_patient_not_found_raises_error(self, doctor_user):
        """Verify exception when non-existent patient UUID is requested."""
        import uuid
        service = PredictionService()
        with pytest.raises(PatientNotFoundError):
            service.predict_patient(patient_id=uuid.uuid4(), requested_by=doctor_user)

    def test_batch_prediction_vectorized(self, sample_vitals_dict, doctor_user):
        """Verify batch inference handles multiple records efficiently."""
        records = [
            {**sample_vitals_dict, "age": 45, "gender": "MALE"},
            {**sample_vitals_dict, "heart_rate": 72, "oxygen_saturation": 99, "age": 28, "gender": "FEMALE"},
            {**sample_vitals_dict, "heart_rate": 130, "oxygen_saturation": 88, "age": 70, "gender": "OTHER"},
        ]

        service = PredictionService()
        results = service.predict_batch(records=records, requested_by=doctor_user)

        assert len(results) == 3
        for res in results:
            assert res["prediction"] in RiskLevel.values
            assert 0.0 <= res["probability"] <= 1.0
            assert res["inference_latency_ms"] >= 0.0

    def test_clinician_override_with_audit_trail(self, test_patient, clinical_vitals_record, doctor_user):
        """Verify physician can override AI risk prediction and an immutable audit entry is logged."""
        service = PredictionService()
        prediction = service.predict_patient(patient_id=test_patient.id, requested_by=doctor_user)

        updated = service.record_clinical_override(
            prediction_id=prediction.id,
            clinician_override=RiskLevel.HIGH,
            override_reason="Patient displays refractory tachypnea and subtle hemodynamic instability.",
            user=doctor_user,
        )

        assert updated.clinician_override == RiskLevel.HIGH
        assert "refractory tachypnea" in updated.override_reason
        assert updated.overridden_by == doctor_user

        # Check AuditLog
        audit = AuditLog.objects.filter(resource_id=str(prediction.id), action=AuditLog.Action.UPDATE).first()
        assert audit is not None
        assert audit.user == doctor_user
        assert audit.metadata["new_override"] == RiskLevel.HIGH


@pytest.mark.django_db
class TestPredictionAPI:
    """Integration tests for Prediction REST endpoints."""

    def test_create_prediction_endpoint(self, auth_client, doctor_user, test_patient, clinical_vitals_record):
        """POST /api/v1/predictions/ produces a 201 response with prediction and explanation."""
        auth_client.force_authenticate(user=doctor_user)
        payload = {"patient_id": str(test_patient.id)}

        response = auth_client.post("/api/v1/predictions/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()

        assert data["patient"] == str(test_patient.id)
        assert data["prediction_result"] in RiskLevel.values
        assert "explanation" in data
        assert "top_risk_factors" in data["explanation"]
        assert float(data["inference_latency_ms"]) >= 0.0

    def test_batch_prediction_endpoint(self, auth_client, doctor_user, sample_vitals_dict):
        """POST /api/v1/predictions/batch/ returns vectorized inference array."""
        auth_client.force_authenticate(user=doctor_user)
        payload = {
            "records": [
                {**sample_vitals_dict, "age": 60, "gender": "MALE"},
                {**sample_vitals_dict, "heart_rate": 65, "age": 25, "gender": "FEMALE"},
            ]
        }

        response = auth_client.post("/api/v1/predictions/batch/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_items"] == 2
        assert len(data["data"]) == 2

    def test_override_prediction_endpoint(self, auth_client, doctor_user, test_patient, clinical_vitals_record):
        """POST /api/v1/predictions/{id}/override/ updates clinical override."""
        service = PredictionService()
        pred = service.predict_patient(patient_id=test_patient.id, requested_by=doctor_user)

        auth_client.force_authenticate(user=doctor_user)
        override_payload = {
            "clinician_override": "CRITICAL",
            "override_reason": "Rapid clinical decompensation noted on physical bedside exam.",
        }

        response = auth_client.post(f"/api/v1/predictions/{pred.id}/override/", override_payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["clinician_override"] == "CRITICAL"
        assert data["override_reason"] == override_payload["override_reason"]

    def test_patient_can_only_view_own_predictions(
        self, auth_client, patient_user, other_patient, doctor_user
    ):
        """Verify patient role cannot access another patient's predictions (403/empty)."""
        # Create prediction for other_patient with explicit vitals
        service = PredictionService()
        pred = service.predict_patient(
            patient_id=other_patient.id,
            vitals={"heart_rate": 80, "respiratory_rate": 18, "temperature": 37.0, "oxygen_saturation": 98},
            requested_by=doctor_user,
        )

        # Authenticate as patient_user (who is NOT other_patient)
        auth_client.force_authenticate(user=patient_user)

        # 1. Detail view must reject with 403 Forbidden or 404 Not Found (privacy scoped)
        detail_res = auth_client.get(f"/api/v1/predictions/{pred.id}/")
        assert detail_res.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

        # 2. Patient cannot run predictions (only Clinician/Admin)
        post_res = auth_client.post("/api/v1/predictions/", {"patient_id": str(other_patient.id)}, format="json")
        assert post_res.status_code == status.HTTP_403_FORBIDDEN
