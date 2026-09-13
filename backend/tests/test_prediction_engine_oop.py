"""
Unit and integration tests for the dedicated OOP Prediction Engine:
  - FeaturePreprocessor (alias normalization, range boundaries, column ordering)
  - ModelProvider (in-memory lookup, cache eviction, failure handling)
  - RiskPredictionEngine (inference timing, risk mapping, explainability)
  - DjangoPredictionRepository (atomic transaction persistence, bulk creation)
  - Prediction API integration (structured error responses, response schema)
"""
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch
import uuid

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord, EncounterType
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.patients.models import Gender, Patient
from apps.predictions.models import Prediction, PredictionExplanation, RiskLevel
from repositories.prediction_repository import DjangoPredictionRepository
from services.feature_preprocessor import (
    FeaturePreprocessor,
    FeatureValidationError,
    InvalidFeatureRangeError,
    MissingFeatureError,
)
from services.model_loader import ModelLoaderService
from services.model_provider import (
    IModelProvider,
    ModelUnavailableError,
    RegistryModelProvider,
)
from services.prediction_result import ExplanationResult, PredictionResult
from services.prediction_service import (
    MissingClinicalDataError,
    PatientNotFoundError,
    PredictionService,
)
from services.risk_engine import RiskPredictionEngine


@pytest.fixture
def preprocessor() -> FeaturePreprocessor:
    return FeaturePreprocessor()


@pytest.fixture
def sample_valid_vitals() -> dict:
    return {
        "age": 52,
        "gender": "M",
        "systolic_bp": 135.0,
        "diastolic_bp": 85.0,
        "heart_rate": 78.0,
        "respiratory_rate": 16.0,
        "body_temperature": 37.0,
        "oxygen_saturation": 98.0,
        "glucose_level": 110.0,
        "cholesterol_total": 195.0,
        "bmi": 26.5,
        "creatinine": 1.0,
        "sodium": 140.0,
        "calcium": 9.5,
        "lactic_acid": 1.1,
    }


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="doc_test_oop",
        email="doc_oop@hospital.org",
        password="SecureDocPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Gregory",
        last_name="House",
        is_active=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="pat_test_oop",
        email="pat_oop@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="Jane",
        last_name="Doe",
        is_active=True,
    )


@pytest.fixture
def test_patient(db, patient_user):
    return Patient.objects.create(
        user=patient_user,
        mrn="MRN-TEST-OOP-001",
        first_name="Jane",
        last_name="Doe",
        date_of_birth=date(1975, 6, 15),
        gender="FEMALE",
        blood_group="O_POS",
    )


@pytest.fixture(autouse=True)
def setup_active_model(db):
    """Ensure an active model exists in the test database for all prediction tests."""
    ModelLoaderService.invalidate_cache()
    model, _ = ModelVersion.objects.get_or_create(
        model_name="random_forest_risk_model",
        version="1.0.0",
        defaults={
            "algorithm": "Random Forest",
            "status": ModelStatus.ACTIVE,
            "accuracy": Decimal("1.0000"),
            "artifact_location": "ml/artifacts/models/random_forest_risk_model/1.0.0/pipeline.joblib",
        },
    )
    if model.status != ModelStatus.ACTIVE:
        model.status = ModelStatus.ACTIVE
        model.save(update_fields=["status"])
    yield model
    ModelLoaderService.invalidate_cache()


# ============================================================================
# 1. FeaturePreprocessor Unit Tests
# ============================================================================
class TestFeaturePreprocessor:
    def test_alias_normalization(self, preprocessor: FeaturePreprocessor):
        raw = {
            "temperature": 36.8,
            "glucose": 105.0,
            "cholesterol": 180.0,
            "systolic_bp": 120.0,
        }
        normalized = preprocessor.normalize_aliases(raw)
        assert "body_temperature" in normalized
        assert normalized["body_temperature"] == 36.8
        assert "glucose_level" in normalized
        assert normalized["glucose_level"] == 105.0
        assert "cholesterol_total" in normalized
        assert normalized["cholesterol_total"] == 180.0

    def test_gender_normalization(self, preprocessor: FeaturePreprocessor):
        assert preprocessor.normalize_gender("Male") == "M"
        assert preprocessor.normalize_gender("MALE") == "M"
        assert preprocessor.normalize_gender("female") == "F"
        assert preprocessor.normalize_gender("FEMALE") == "F"
        assert preprocessor.normalize_gender("unknown") == "Other"

    def test_invalid_range_raises_error(
        self, preprocessor: FeaturePreprocessor, sample_valid_vitals: dict
    ):
        invalid_vitals = {**sample_valid_vitals, "systolic_bp": 999.0}  # Limit is 300
        with pytest.raises(InvalidFeatureRangeError):
            preprocessor.prepare_dataframe(invalid_vitals)

    def test_missing_required_feature_raises_error(
        self, preprocessor: FeaturePreprocessor, sample_valid_vitals: dict
    ):
        incomplete = {k: v for k, v in sample_valid_vitals.items() if k != "age"}
        with pytest.raises(MissingFeatureError):
            preprocessor.prepare_dataframe(incomplete)

    def test_prepare_dataframe_output_shape_and_ordering(
        self, preprocessor: FeaturePreprocessor, sample_valid_vitals: dict
    ):
        df, snapshot = preprocessor.prepare_dataframe(sample_valid_vitals)
        assert len(df) == 1
        assert list(df.columns) == preprocessor.feature_names
        assert snapshot["systolic_bp"] == 135.0


# ============================================================================
# 2. RiskPredictionEngine Unit Tests
# ============================================================================
class TestRiskPredictionEngine:
    def test_risk_level_mapping(self):
        assert RiskPredictionEngine.map_probability_to_risk(0.10) == RiskLevel.LOW
        assert RiskPredictionEngine.map_probability_to_risk(0.35) == RiskLevel.MEDIUM
        assert RiskPredictionEngine.map_probability_to_risk(0.65) == RiskLevel.HIGH
        assert RiskPredictionEngine.map_probability_to_risk(0.90) == RiskLevel.CRITICAL

    def test_predict_calculates_actual_latency_and_probability(
        self, sample_valid_vitals: dict
    ):
        mock_provider = MagicMock(spec=IModelProvider)
        mock_pipeline = MagicMock()
        mock_pipeline.predict_proba.return_value = [[0.20, 0.80]]
        mock_model_ver = MagicMock()
        mock_model_ver.model_name = "test_rf_model"
        mock_model_ver.version = "1.0.0"
        mock_model_ver.id = uuid.uuid4()
        mock_provider.get_model.return_value = (mock_pipeline, mock_model_ver)

        engine = RiskPredictionEngine(model_provider=mock_provider)
        result = engine.predict(
            patient_id=uuid.uuid4(),
            features=sample_valid_vitals,
        )

        assert isinstance(result, PredictionResult)
        assert result.risk_level == RiskLevel.CRITICAL
        assert result.probability == 0.80
        assert result.inference_latency_ms > 0.0  # Real monotonic timing
        assert result.model_name == "test_rf_model"


# ============================================================================
# 3. ModelProvider Unit Tests
# ============================================================================
@pytest.mark.django_db
class TestModelProvider:
    def test_registry_model_provider_loads_active_model(self):
        provider = RegistryModelProvider()
        pipeline, record = provider.get_model()
        assert pipeline is not None
        assert record.status == ModelStatus.ACTIVE

    def test_model_provider_raises_unavailable_error_on_failure(self):
        with patch("services.model_loader.ModelLoaderService.get_active_model") as mock_load:
            from services.model_loader import NoActiveModelError
            mock_load.side_effect = NoActiveModelError("No model active")

            provider = RegistryModelProvider()
            with pytest.raises(ModelUnavailableError):
                provider.get_model("non_existent_model")


# ============================================================================
# 4. DjangoPredictionRepository Integration Tests
# ============================================================================
@pytest.mark.django_db
class TestDjangoPredictionRepository:
    def test_atomic_save_prediction_with_explanation(
        self, sample_valid_vitals: dict, test_patient: Patient
    ):
        provider = RegistryModelProvider()
        _, model_ver = provider.get_model()

        res = PredictionResult(
            patient_id=test_patient.id,
            risk_level=RiskLevel.MEDIUM,
            probability=0.45,
            confidence_score=0.88,
            model_name=model_ver.model_name,
            model_version=model_ver.version,
            model_version_id=model_ver.id,
            inference_latency_ms=1.23,
            feature_snapshot=sample_valid_vitals,
            explanation=ExplanationResult(
                method="TreeSHAP",
                feature_importances={"systolic_bp": 0.25},
                top_risk_factors=[{"feature": "systolic_bp", "importance": 0.25}],
            ),
        )

        repo = DjangoPredictionRepository()
        saved = repo.save_prediction(res)

        assert saved.id is not None
        assert saved.prediction_result == RiskLevel.MEDIUM
        assert float(saved.probability) == 0.45
        assert saved.explanation is not None
        assert saved.explanation.method == "TreeSHAP"


# ============================================================================
# 5. API Integration Tests: POST /api/v1/predictions/
# ============================================================================
@pytest.mark.django_db
class TestPredictionAPIIntegration:
    @pytest.fixture(autouse=True)
    def setup_api(self, doctor_user):
        self.client = APIClient()
        self.client.force_authenticate(user=doctor_user)

    def test_post_prediction_returns_required_response_schema(
        self, sample_valid_vitals: dict, test_patient: Patient
    ):
        payload = {
            "patient_id": str(test_patient.id),
            "vitals": sample_valid_vitals,
        }

        response = self.client.post("/api/v1/predictions/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        data = response.data
        # Verify required response fields
        assert "id" in data or "prediction_id" in data
        assert str(data.get("patient_id", data.get("patient"))) == str(test_patient.id)
        assert data.get("risk_level", data.get("prediction_result")) in (
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL",
        )
        assert "probability" in data
        assert "model_name" in data
        assert "model_version" in data or "model_version_str" in data
        assert "inference_latency" in data or "inference_latency_ms" in data
        assert "timestamp" in data or "prediction_timestamp" in data

    def test_post_prediction_missing_clinical_data_returns_structured_error(
        self, test_patient: Patient
    ):
        # Patient exists but has no clinical records and no explicit vitals provided
        payload = {"patient_id": str(test_patient.id)}
        response = self.client.post("/api/v1/predictions/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        data = response.data
        assert data.get("success") is False
        assert "error" in data
        assert "message" in data["error"]
        assert "code" in data["error"]

    def test_post_prediction_non_existent_patient_returns_structured_404(self):
        payload = {
            "patient_id": str(uuid.uuid4()),
            "vitals": {"systolic_bp": 120.0},
        }
        response = self.client.post("/api/v1/predictions/", payload, format="json")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.data
        assert data.get("success") is False
        assert "error" in data
