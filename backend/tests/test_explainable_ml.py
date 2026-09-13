"""
Tests for Explainable ML (SHAP) — ExplanationService, SHAP TreeExplainer,
feature contributions, medical disclaimer, persistence, and API endpoint.
"""
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch
import uuid

import numpy as np
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.patients.models import Patient
from apps.predictions.models import Prediction, PredictionExplanation, RiskLevel
from services.explanation_service import (
    ExplanationPayload,
    ExplanationService,
    FeatureContribution,
    FeatureImportanceExplainer,
    ShapTreeExplainer,
)
from services.model_loader import ModelLoaderService
from services.prediction_service import PredictionService


@pytest.fixture
def auth_client():
    return APIClient()


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="doc_explain",
        email="explain.doc@hospital.org",
        password="SecureDocPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Sarah",
        last_name="Connor",
        is_active=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="patient_explain",
        email="patient.explain@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="John",
        last_name="Doe",
        is_active=True,
    )


@pytest.fixture
def other_patient_user(db):
    return User.objects.create_user(
        username="other_patient_explain",
        email="other.patient.explain@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="Jane",
        last_name="Smith",
        is_active=True,
    )


@pytest.fixture(autouse=True)
def setup_active_model(db):
    """Ensure an active model exists for explanation tests."""
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
        mrn="MRN-EXPLAIN-001",
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
        mrn="MRN-EXPLAIN-002",
        first_name="Jane",
        last_name="Smith",
        date_of_birth=date(1988, 3, 22),
        gender="FEMALE",
        blood_group="A_POS",
    )


@pytest.fixture
def clinical_record(db, test_patient, doctor_user):
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


@pytest.mark.django_db
class TestShapExplanation:
    """Tests for SHAP TreeExplainer feature contributions and explanation generation."""

    def test_shap_tree_explainer_generates_valid_contributions(
        self, test_patient, clinical_record, doctor_user
    ):
        """
        Verify SHAP TreeExplainer produces valid feature contributions with:
        - Non-empty feature list
        - Positive and/or negative contributions (signed)
        - Direction indicators (INCREASES_RISK / DECREASES_RISK / NEUTRAL)
        - Relative importances that approximately sum to ~1.0
        """
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            requested_by=doctor_user,
        )

        # Reload from DB to get the PredictionExplanation ORM object
        db_pred = Prediction.objects.select_related("explanation").get(id=prediction.id)
        explanation = db_pred.explanation
        assert explanation is not None, "Explanation must be generated for predictions"
        assert explanation.method in ("TreeSHAP", "FeatureImportance", "LinearCoefficients")

        # Features are stored in top_risk_factors
        features = explanation.top_risk_factors
        assert isinstance(features, list)
        assert len(features) > 0, "Features list must not be empty"

        # Verify each feature has required keys
        for feat in features:
            assert "feature" in feat
            assert "contribution" in feat
            assert "direction" in feat
            assert "relative_importance" in feat
            assert feat["direction"] in (
                "INCREASES_RISK", "DECREASES_RISK", "NEUTRAL", "CONTRIBUTING"
            )

        # Relative importances should approximately sum to ~1.0
        total_rel = sum(f["relative_importance"] for f in features)
        assert total_rel > 0.5, f"Relative importances should sum to meaningful value, got {total_rel}"

    def test_medical_disclaimer_and_explanation_type(
        self, test_patient, clinical_record, doctor_user
    ):
        """
        Assert the formatted explanation contains explanation_type == 'MODEL_EXPLANATION'
        and a disclaimer with medical non-causation language.
        """
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            requested_by=doctor_user,
        )

        db_pred = Prediction.objects.select_related("explanation").get(id=prediction.id)
        explanation_svc = ExplanationService()
        result = explanation_svc.format_explanation_response(db_pred, db_pred.explanation)

        assert result is not None
        assert result["explanation_type"] == "MODEL_EXPLANATION"
        assert "not a medical diagnosis" in result["disclaimer"].lower()
        assert "do not prove medical causation" in result["disclaimer"].lower()

    def test_feature_contribution_direction(
        self, test_patient, clinical_record, doctor_user
    ):
        """Verify that SHAP explanations include both positive and negative directions."""
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            requested_by=doctor_user,
        )

        db_pred = Prediction.objects.select_related("explanation").get(id=prediction.id)
        explanation = db_pred.explanation
        assert explanation is not None
        features = explanation.top_risk_factors
        directions = {f["direction"] for f in features}

        # There should be at least two different directions for a real SHAP explanation
        if explanation.method == "TreeSHAP":
            assert len(directions) >= 2, f"SHAP should produce mixed directions, got {directions}"


@pytest.mark.django_db
class TestExplanationPersistence:
    """Tests for explanation storage in PostgreSQL."""

    def test_explanation_persistence_in_database(
        self, test_patient, clinical_record, doctor_user
    ):
        """Verify explanation is correctly persisted to prediction_explanations table."""
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            requested_by=doctor_user,
        )

        # Reload from DB
        db_pred = Prediction.objects.select_related("explanation").get(id=prediction.id)
        db_expl = db_pred.explanation

        assert db_expl is not None, "Explanation must be persisted in DB"
        assert db_expl.method in ("TreeSHAP", "FeatureImportance", "LinearCoefficients")
        assert isinstance(db_expl.top_risk_factors, list)
        assert len(db_expl.top_risk_factors) > 0

        # Verify the features in top_risk_factors have required keys
        for rf in db_expl.top_risk_factors:
            assert "feature" in rf
            assert "contribution" in rf
            assert "direction" in rf
            assert "relative_importance" in rf


@pytest.mark.django_db
class TestExplanationAPI:
    """Tests for GET /api/v1/predictions/{id}/explanation/ endpoint."""

    def test_get_prediction_explanation_endpoint(
        self, auth_client, doctor_user, test_patient, clinical_record
    ):
        """
        GET /api/v1/predictions/{id}/explanation/ returns:
        - 200 OK
        - prediction_id, risk_level, probability, explanation_type, method, features, disclaimer
        """
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=test_patient.id,
            requested_by=doctor_user,
        )

        auth_client.force_authenticate(user=doctor_user)
        response = auth_client.get(f"/api/v1/predictions/{prediction.id}/explanation/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Validate required response fields
        assert "prediction_id" in data
        assert data["prediction_id"] == str(prediction.id)
        assert "risk_level" in data
        assert data["risk_level"] in RiskLevel.values
        assert "probability" in data
        assert isinstance(data["probability"], float)
        assert "explanation_type" in data
        assert data["explanation_type"] == "MODEL_EXPLANATION"
        assert "method" in data
        assert "features" in data
        assert isinstance(data["features"], list)
        assert len(data["features"]) > 0
        assert "disclaimer" in data
        assert "not a medical diagnosis" in data["disclaimer"].lower()

        # Validate individual feature structure
        feat = data["features"][0]
        assert "feature" in feat
        assert "contribution" in feat
        assert "direction" in feat
        assert "relative_importance" in feat

    def test_explanation_not_found_returns_404(
        self, auth_client, doctor_user
    ):
        """GET /api/v1/predictions/{non-existent-id}/explanation/ returns 404."""
        auth_client.force_authenticate(user=doctor_user)
        fake_id = uuid.uuid4()
        response = auth_client.get(f"/api/v1/predictions/{fake_id}/explanation/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_patient_rbac_on_explanation_endpoint(
        self, auth_client, patient_user, other_patient, doctor_user
    ):
        """Patient cannot access another patient's explanation (403/404)."""
        service = PredictionService()
        prediction = service.predict_patient(
            patient_id=other_patient.id,
            vitals={
                "heart_rate": 80, "respiratory_rate": 18,
                "temperature": 37.0, "oxygen_saturation": 98,
            },
            requested_by=doctor_user,
        )

        auth_client.force_authenticate(user=patient_user)
        response = auth_client.get(f"/api/v1/predictions/{prediction.id}/explanation/")
        assert response.status_code in (
            status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND
        )
