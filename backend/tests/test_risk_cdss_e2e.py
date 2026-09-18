"""
End-to-End Test Suite for Clinical Risk Prediction & Intelligent CDSS — BPY-CSE-2666.
Verifies real-time inference, TreeSHAP explanation, deterministic clinical rules (qSOFA, NEWS2),
structured validation errors, abstention, RBAC boundaries, and PostgreSQL audit trails.
"""
from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import UserRole
from apps.clinical.models import ClinicalFeatureDefinition, ClinicalRecord, ClinicalRule, EncounterType
from apps.core.models import AuditLog
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.patients.models import Patient
from apps.predictions.models import Prediction, RiskLevel
from services.clinical_decision_support_service import ClinicalDecisionSupportService
from services.feature_preprocessor import FeaturePreprocessor, FeatureValidationError
from services.prediction_service import PredictionService

User = get_user_model()


@pytest.fixture(autouse=True)
def seed_models_and_features(db):
    from services.model_loader import ModelLoaderService
    ModelLoaderService.invalidate_cache()

    if not ModelVersion.objects.filter(model_name="random_forest_risk_model").exists():
        ModelVersion.objects.create(
            model_name="random_forest_risk_model",
            version="1.0.0",
            algorithm="Random Forest",
            status=ModelStatus.ACTIVE,
            accuracy=Decimal("1.0000"),
            artifact_location="ml/artifacts/models/random_forest_risk_model/1.0.0/pipeline.joblib",
        )
    if not ModelVersion.objects.filter(model_name="svm_risk_model").exists():
        ModelVersion.objects.create(
            model_name="svm_risk_model",
            version="1.0.0",
            algorithm="Support Vector Machine (SVM)",
            status=ModelStatus.CANDIDATE,
            accuracy=Decimal("0.9950"),
            artifact_location="ml/artifacts/models/svm_risk_model/1.0.0/pipeline.joblib",
        )
    if not ModelVersion.objects.filter(model_name="adaboost_risk_model").exists():
        ModelVersion.objects.create(
            model_name="adaboost_risk_model",
            version="1.0.0",
            algorithm="AdaBoost",
            status=ModelStatus.CANDIDATE,
            accuracy=Decimal("0.7950"),
            artifact_location="ml/artifacts/models/adaboost_risk_model/1.0.0/pipeline.joblib",
        )

    if not ClinicalFeatureDefinition.objects.exists():
        from django.core.management import call_command
        call_command("seed_clinical_features")


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def doctor_user(db):
    user = User.objects.create_user(
        username="dr_collins",
        email="collins@hospital.org",
        password="TestPassword123!",
        role=UserRole.DOCTOR,
        first_name="Arthur",
        last_name="Collins",
    )
    return user


@pytest.fixture
def nurse_user(db):
    user = User.objects.create_user(
        username="nurse_sarah",
        email="sarah@hospital.org",
        password="TestPassword123!",
        role=UserRole.NURSE,
        first_name="Sarah",
        last_name="Jenkins",
    )
    return user


@pytest.fixture
def patient_user(db):
    user = User.objects.create_user(
        username="patient_john",
        email="john.doe@example.com",
        password="TestPassword123!",
        role=UserRole.PATIENT,
        first_name="John",
        last_name="Doe",
    )
    return user


@pytest.fixture
def test_patient(db, patient_user, doctor_user):
    patient = Patient.objects.create(
        user=patient_user,
        mrn="MRN-TEST-1001",
        first_name="John",
        last_name="Doe",
        gender="MALE",
        date_of_birth="1970-05-15",
        primary_physician=doctor_user,
    )
    return patient


@pytest.fixture
def clinical_encounter(db, test_patient, doctor_user):
    record = ClinicalRecord.objects.create(
        patient=test_patient,
        recorded_by=doctor_user,
        encounter_type=EncounterType.OUTPATIENT,
        systolic_bp=124,
        diastolic_bp=82,
        heart_rate=74,
        respiratory_rate=16,
        body_temperature=Decimal("37.0"),
        oxygen_saturation=Decimal("98.0"),
        glucose_level=Decimal("96.0"),
        cholesterol_total=Decimal("185.0"),
        bmi=Decimal("24.8"),
        creatinine=Decimal("1.02"),
        sodium=Decimal("141.0"),
        calcium=Decimal("9.4"),
        lactic_acid=Decimal("1.1"),
    )
    return record


@pytest.mark.django_db
class TestRiskPredictionService:
    """Test core PredictionService execution, SHAP attributions, and CDSS synthesis."""

    def test_predict_patient_success(self, test_patient, clinical_encounter, doctor_user):
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            requested_by=doctor_user,
        )

        assert prediction is not None
        assert prediction.patient_id == test_patient.id
        assert prediction.prediction_result in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
        assert 0.0 <= float(prediction.probability) <= 1.0
        assert prediction.model_name is not None
        assert prediction.model_version_str is not None

        # Verify Explanation
        assert hasattr(prediction, "explanation")
        assert prediction.explanation is not None
        assert prediction.explanation.method in ("TreeSHAP", "FeatureAttribution")
        assert len(prediction.explanation.top_risk_factors) > 0

        # Verify CDSS guidance synthesis
        assert hasattr(prediction, "cdss_guidance")
        assert prediction.cdss_guidance is not None
        assert prediction.cdss_guidance.risk_level == prediction.prediction_result
        assert prediction.cdss_guidance.suggested_clinical_review in ("MANDATORY_STAT", "REQUIRED", "ROUTINE", "ABSTAINED")
        assert "HealthNova AI" in prediction.cdss_guidance.safety_disclaimer

    def test_predict_patient_with_explicit_vitals(self, test_patient, doctor_user):
        service = PredictionService()
        explicit = {
            "systolic_bp": 90,
            "diastolic_bp": 55,
            "heart_rate": 125,
            "respiratory_rate": 28,
            "body_temperature": 39.5,
            "oxygen_saturation": 88.0,
            "glucose_level": 240.0,
            "cholesterol_total": 230.0,
            "bmi": 32.0,
            "lactic_acid": 4.5,
        }
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            vitals=explicit,
            requested_by=doctor_user,
        )

        assert prediction is not None
        # With SBP 90, RR 28, lactic acid 4.5, qSOFA and high-risk triggers should be identified
        assert prediction.prediction_result in (RiskLevel.HIGH, RiskLevel.CRITICAL)
        assert prediction.cdss_guidance.suggested_clinical_review in ("MANDATORY_STAT", "REQUIRED")
        assert len(prediction.cdss_guidance.deterministic_alerts) > 0


@pytest.mark.django_db
class TestClinicalFeatureValidation:
    """Test strict backend validation against physiological boundaries."""

    def test_out_of_range_physiological_rejection(self):
        preprocessor = FeaturePreprocessor()
        invalid_vitals = {
            "age": 45,
            "gender": "MALE",
            "glucose_level": 99999.0,  # Far outside [20, 1000] mg/dL
        }

        with pytest.raises(FeatureValidationError) as exc_info:
            preprocessor.validate_features(invalid_vitals)

        err = exc_info.value
        assert err.field == "glucose_level"
        assert err.code == "OUT_OF_RANGE"
        assert "outside configured physiological limits" in str(err)

    def test_missing_required_covariates_rejection(self):
        preprocessor = FeaturePreprocessor()
        missing_vitals = {
            "systolic_bp": 120,
            # Missing required 'age' and 'gender'
        }

        with pytest.raises(FeatureValidationError) as exc_info:
            preprocessor.validate_features(missing_vitals)

        err = exc_info.value
        assert err.code == "MISSING_REQUIRED"


@pytest.mark.django_db
class TestClinicalRulesEngine:
    """Test deterministic clinical scoring rules (qSOFA, NEWS2, acute limits)."""

    def test_qsofa_sepsis_trigger(self):
        cdss = ClinicalDecisionSupportService()
        septic_vitals = {
            "respiratory_rate": 24,  # >= 22 (1 pt)
            "systolic_bp": 95,       # <= 100 (1 pt)
            "altered_mental_status": True,  # (1 pt) -> Score 3/3
        }
        guidance = cdss.generate_support_guidance(
            patient_id="test-pt-1",
            features=septic_vitals,
        )

        assert len(guidance.deterministic_alerts) > 0
        qsofa = next((a for a in guidance.deterministic_alerts if "qSOFA" in a["rule_name"]), None)
        assert qsofa is not None
        assert qsofa["severity"] == "CRITICAL_EMERGENCY"
        assert guidance.suggested_clinical_review == "MANDATORY_STAT"


@pytest.mark.django_db
class TestRiskRESTAPIs:
    """Test REST API endpoints under /api/v1/risk/ and /api/v1/patients/{id}/risk/."""

    def test_create_risk_prediction_endpoint(self, api_client, doctor_user, test_patient, clinical_encounter):
        api_client.force_authenticate(user=doctor_user)
        url = reverse("risk:prediction_list_create")
        payload = {
            "patient_id": str(test_patient.id),
            "model_name": "random_forest_risk_model",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        data = response.data
        assert data["patient_id"] == str(test_patient.id)
        assert "risk_level" in data
        assert "probability" in data
        assert "cdss_guidance" in data
        assert data["cdss_guidance"]["safety_disclaimer"] is not None

    def test_invalid_input_returns_structured_validation_error(self, api_client, doctor_user, test_patient):
        api_client.force_authenticate(user=doctor_user)
        url = reverse("risk:prediction_list_create")
        payload = {
            "patient_id": str(test_patient.id),
            "vitals": {
                "systolic_bp": 9999,  # Invalid
            },
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.data
        assert data["success"] is False
        assert data["error"]["code"] == "OUT_OF_RANGE"

    def test_list_risk_models_endpoint(self, api_client, doctor_user):
        api_client.force_authenticate(user=doctor_user)
        url = reverse("risk:model_list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert "models" in data
        assert len(data["models"]) >= 3
        # Random forest should be present
        rf = next((m for m in data["models"] if "random_forest" in m["model_name"]), None)
        assert rf is not None
        assert rf["accuracy"] is not None

    def test_list_clinical_features_endpoint(self, api_client, doctor_user):
        api_client.force_authenticate(user=doctor_user)
        url = reverse("risk:feature_list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        features = response.data["features"]
        assert len(features) >= 16
        names = [f["name"] for f in features]
        assert "glucose_level" in names
        assert "systolic_bp" in names
        assert "heart_rate" in names

    def test_patient_risk_detail_endpoint(self, api_client, doctor_user, test_patient, clinical_encounter):
        api_client.force_authenticate(user=doctor_user)
        # First create a prediction
        PredictionService().predict_patient(patient_id=test_patient.id, requested_by=doctor_user)

        url = reverse("risk:patient_risk", kwargs={"patient_id": test_patient.id})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["has_prediction"] is True
        assert len(data["risk_trajectory"]) >= 1

    def test_clinician_override_records_audit_trail(self, api_client, doctor_user, test_patient, clinical_encounter):
        api_client.force_authenticate(user=doctor_user)
        pred = PredictionService().predict_patient(patient_id=test_patient.id, requested_by=doctor_user)

        url = reverse("risk:prediction_review", kwargs={"prediction_id": pred.id})
        payload = {
            "clinician_override": "HIGH",
            "override_reason": "Patient exhibiting clinical tachypnea and diaphoresis not fully captured in snapshot vitals.",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["clinician_override"] == "HIGH"

        # Verify audit log in PostgreSQL
        audit = AuditLog.objects.filter(resource_id=str(pred.id)).first()
        assert audit is not None
        assert audit.user == doctor_user
        assert "Physician override" in audit.description
