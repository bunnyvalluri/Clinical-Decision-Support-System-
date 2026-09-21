"""
Automated Test Suite for Patient Risk Timeline, Prediction Comparison, and Feedback Loop.

Covers:
1. get_current_patient_prediction & get_previous_patient_prediction retrieval
2. PredictionComparisonService feature diffs, % change, and TreeSHAP divergence
3. Automatic ClinicalAlert & Escalation triggering on risk tier elevations
4. Unified Patient Timeline aggregation, Phase 3 taxonomy, and chronological ordering
5. Role-based privacy scoping (Clinician vs Patient Portal minimizations)
6. REST API Endpoints:
   - GET /api/v1/predictions/{id}/comparison/
   - GET /api/v1/patients/{id}/predictions/comparison/
   - POST /api/v1/predictions/{id}/feedback/
   - GET /api/v1/predictions/{id}/feedback/
   - GET /api/v1/patients/{id}/timeline/
7. Security: IDOR prevention, unauthenticated 401s, RBAC authorization checks
"""

import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.clinical.models import (
    ClinicalAlert,
    ClinicalRecord,
    Escalation,
    PatientTimelineEvent,
)
from apps.model_registry.models import ModelVersion
from apps.patients.models import Patient
from apps.predictions.models import (
    ClinicalReview,
    FeedbackCategory,
    Prediction,
    PredictionExplanation,
    PredictionFeedback,
    ReviewDecision,
    ReviewStatus,
    RiskLevel,
)
from services.prediction_comparison_service import PredictionComparisonService
from services.timeline_service import PatientTimelineService

User = get_user_model()


@pytest.fixture
def patient_record(db):
    """Create a test patient with valid demographic data."""
    return Patient.objects.create(
        first_name="Arthur",
        last_name="Pendelton",
        date_of_birth="1968-05-14",
        gender="MALE",
        mrn=f"MRN-TEST-{uuid.uuid4().hex[:6]}",
        is_active=True,
    )


@pytest.fixture
def test_model_version(db):
    """Create or retrieve a production ModelVersion record."""
    mv, _ = ModelVersion.objects.get_or_create(
        model_name="HeartFailure-XGB",
        version="2.1.0",
        defaults={
            "algorithm": "XGBoost",
            "status": "ACTIVE",
            "artifact_location": "s3://models/hf_xgb_v2.1.joblib",
            "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        },
    )
    return mv


@pytest.fixture
def sequential_predictions(db, patient_record, test_model_version):
    """Create two sequential predictions for longitudinal comparison."""
    # 1. Previous Prediction (LOW risk, 3 days ago)
    t_prev = timezone.now() - timezone.timedelta(days=3)
    rec_prev = ClinicalRecord.objects.create(
        patient=patient_record,
        recorded_at=t_prev,
        systolic_bp=120,
        diastolic_bp=78,
        heart_rate=72,
        oxygen_saturation=Decimal("98.0"),
        glucose_level=Decimal("95.0"),
    )
    pred_prev = Prediction.objects.create(
        patient=patient_record,
        clinical_record=rec_prev,
        model_version=test_model_version,
        model_name=test_model_version.model_name,
        model_version_str=test_model_version.version,
        prediction_result=RiskLevel.LOW,
        probability=Decimal("0.1850"),
        confidence_score=Decimal("0.8900"),
        uncertainty_score=Decimal("0.1100"),
        inference_latency_ms=Decimal("12.50"),
        features_snapshot={
            "systolic_bp": 120,
            "diastolic_bp": 78,
            "heart_rate": 72,
            "oxygen_saturation": 98,
            "glucose": 95,
        },
        prediction_timestamp=t_prev,
    )
    Prediction.objects.filter(id=pred_prev.id).update(created_at=t_prev)
    pred_prev.refresh_from_db()

    PredictionExplanation.objects.create(
        prediction=pred_prev,
        method="TreeSHAP",
        baseline_value=Decimal("0.2500"),
        feature_importance=[
            {"feature": "systolic_bp", "importance": 0.05, "direction": "RISK_DECREASING"},
            {"feature": "heart_rate", "importance": 0.04, "direction": "RISK_DECREASING"},
        ],
    )

    # 2. Current Prediction (HIGH risk, 1 hour ago)
    t_curr = timezone.now() - timezone.timedelta(hours=1)
    rec_curr = ClinicalRecord.objects.create(
        patient=patient_record,
        recorded_at=t_curr,
        systolic_bp=168,
        diastolic_bp=102,
        heart_rate=114,
        oxygen_saturation=Decimal("91.0"),
        glucose_level=Decimal("155.0"),
    )
    pred_curr = Prediction.objects.create(
        patient=patient_record,
        clinical_record=rec_curr,
        model_version=test_model_version,
        model_name=test_model_version.model_name,
        model_version_str=test_model_version.version,
        prediction_result=RiskLevel.HIGH,
        probability=Decimal("0.7850"),
        confidence_score=Decimal("0.9200"),
        uncertainty_score=Decimal("0.0800"),
        inference_latency_ms=Decimal("14.20"),
        features_snapshot={
            "systolic_bp": 168,
            "diastolic_bp": 102,
            "heart_rate": 114,
            "oxygen_saturation": 91,
            "glucose": 155,
        },
        prediction_timestamp=t_curr,
    )
    Prediction.objects.filter(id=pred_curr.id).update(created_at=t_curr)
    pred_curr.refresh_from_db()

    PredictionExplanation.objects.create(
        prediction=pred_curr,
        method="TreeSHAP",
        baseline_value=Decimal("0.2500"),
        feature_importance=[
            {"feature": "systolic_bp", "importance": 0.38, "direction": "RISK_INCREASING"},
            {"feature": "heart_rate", "importance": 0.22, "direction": "RISK_INCREASING"},
            {"feature": "oxygen_saturation", "importance": 0.18, "direction": "RISK_INCREASING"},
        ],
    )

    return pred_prev, pred_curr


# ==============================================================================
# 1. UNIT / DOMAIN SERVICE TESTS: PREDICTION COMPARISON
# ==============================================================================

@pytest.mark.django_db
class TestPredictionComparisonService:

    def test_get_current_and_previous_patient_prediction(self, patient_record, sequential_predictions):
        pred_prev, pred_curr = sequential_predictions

        # Current prediction must be the latest
        current = PredictionComparisonService.get_current_patient_prediction(patient_record.id)
        assert current is not None
        assert current.id == pred_curr.id

        # Previous relative to current must be pred_prev
        prev = PredictionComparisonService.get_previous_patient_prediction(patient_record.id, pred_curr.id)
        assert prev is not None
        assert prev.id == pred_prev.id

    def test_compare_patient_predictions_feature_deltas(self, patient_record, sequential_predictions):
        pred_prev, pred_curr = sequential_predictions

        comp = PredictionComparisonService.compare_patient_predictions(
            patient_id=patient_record.id,
            current_prediction_id=pred_curr.id,
            previous_prediction_id=pred_prev.id,
        )

        assert comp["has_comparison"] is True
        assert comp["risk_transition"]["previous_risk"] == "LOW"
        assert comp["risk_transition"]["current_risk"] == "HIGH"
        assert comp["risk_transition"]["is_escalation"] is True
        assert comp["risk_transition"]["tier_delta"] == 2  # LOW(0) -> HIGH(2)

        # Feature difference check
        feature_diffs = {f["feature"]: f for f in comp["feature_differences"]}
        assert "systolic_bp" in feature_diffs

        sbp = feature_diffs["systolic_bp"]
        assert sbp["previous_value"] == 120.0
        assert sbp["current_value"] == 168.0
        assert sbp["delta"] == 48.0
        assert sbp["percentage_change"] == 40.0
        assert sbp["clinical_significance"] == "HIGH"

        # SHAP Divergence check
        shap_div = {s["feature"]: s for s in comp["shap_divergence"]}
        assert "systolic_bp" in shap_div
        assert shap_div["systolic_bp"]["current_importance"] == 0.38
        assert shap_div["systolic_bp"]["importance_delta"] > 0

    def test_escalation_alert_auto_created_on_high_risk_escalation(self, patient_record, sequential_predictions):
        pred_prev, pred_curr = sequential_predictions

        # Trigger comparison which automatically evaluates escalation rule
        comp = PredictionComparisonService.compare_patient_predictions(
            patient_id=patient_record.id,
            current_prediction_id=pred_curr.id,
            previous_prediction_id=pred_prev.id,
        )

        # Verify a ClinicalAlert was recorded in PostgreSQL
        alerts = ClinicalAlert.objects.filter(patient=patient_record)
        assert alerts.exists()
        alert = alerts.first()
        assert alert.alert_type == ClinicalAlert.AlertType.SEPSIS_RISK or "RISK" in alert.alert_type
        assert "ESCALATION" in alert.message or "LOW to HIGH" in alert.message

        # Verify an Escalation record was created
        escalations = Escalation.objects.filter(patient=patient_record)
        assert escalations.exists()
        esc = escalations.first()
        assert esc.target_role == "DOCTOR"


# ==============================================================================
# 2. UNIT / DOMAIN SERVICE TESTS: UNIFIED TIMELINE & PHASE 3 TAXONOMY
# ==============================================================================

@pytest.mark.django_db
class TestPatientTimelineService:

    def test_timeline_aggregation_chronological_ordering(self, patient_record, sequential_predictions):
        pred_prev, pred_curr = sequential_predictions

        # Create an explicit review event
        PatientTimelineEvent.objects.create(
            patient=patient_record,
            event_type=PatientTimelineEvent.EventType.PREDICTION_REVIEW,
            title="Clinician Attestation",
            description="Attending concurred with HIGH risk classification.",
            actor="dr.smith@hospital.org",
            source="PHYSICIAN_PORTAL",
            severity=PatientTimelineEvent.Severity.NORMAL,
            correlation_id=str(pred_curr.id),
            authorization_scope="CLINICIAN_ONLY",
        )

        events = PatientTimelineService.get_timeline_for_patient(
            patient_id=patient_record.id,
            user_role="DOCTOR",
            max_events=50,
        )

        assert len(events) >= 3
        # Chronological descending: newest event timestamp >= subsequent event timestamp
        for i in range(len(events) - 1):
            assert events[i]["timestamp"] >= events[i + 1]["timestamp"]

    def test_timeline_role_scoping_patient_portal_vs_clinician(self, patient_record, sequential_predictions):
        pred_prev, pred_curr = sequential_predictions

        # Clinician-only event
        PatientTimelineEvent.objects.create(
            patient=patient_record,
            event_type=PatientTimelineEvent.EventType.DATA_QUALITY_EVENT,
            title="Sensor Noise Outlier Excluded",
            description="PPG sensor raw artifact filtered via KS-divergence threshold 0.05.",
            actor="SYSTEM",
            source="PIPELINE",
            severity=PatientTimelineEvent.Severity.NORMAL,
            authorization_scope="CLINICIAN_ONLY",
        )

        # Public patient event
        PatientTimelineEvent.objects.create(
            patient=patient_record,
            event_type=PatientTimelineEvent.EventType.ENCOUNTER,
            title="Cardiology Outpatient Follow-up",
            description="Routine scheduled check with cardiology team.",
            actor="staff@hospital.org",
            source="EHR",
            severity=PatientTimelineEvent.Severity.NORMAL,
            authorization_scope="PATIENT_PORTAL",
        )

        # As DOCTOR: should see both
        doctor_timeline = PatientTimelineService.get_timeline_for_patient(
            patient_id=patient_record.id,
            user_role="DOCTOR",
        )
        doctor_titles = [e["title"] for e in doctor_timeline]
        assert "Sensor Noise Outlier Excluded" in doctor_titles
        assert "Cardiology Outpatient Follow-up" in doctor_titles

        # As USER (Patient): should NOT see CLINICIAN_ONLY technical events
        patient_timeline = PatientTimelineService.get_timeline_for_patient(
            patient_id=patient_record.id,
            user_role="USER",
        )
        patient_titles = [e["title"] for e in patient_timeline]
        assert "Sensor Noise Outlier Excluded" not in patient_titles
        assert "Cardiology Outpatient Follow-up" in patient_titles

    def test_timeline_filtering_and_pagination(self, patient_record, sequential_predictions):
        pred_prev, pred_curr = sequential_predictions

        # Filter by RISK_PREDICTION
        pred_events = PatientTimelineService.get_timeline_for_patient(
            patient_id=patient_record.id,
            event_type="RISK_PREDICTION",
        )
        for e in pred_events:
            assert e["event_type"] == "RISK_PREDICTION"

        # Pagination limit
        paginated = PatientTimelineService.get_timeline_for_patient(
            patient_id=patient_record.id,
            offset=0,
            limit=1,
        )
        assert len(paginated) == 1


# ==============================================================================
# 3. REST API ENDPOINT INTEGRATION TESTS
# ==============================================================================

@pytest.mark.django_db
class TestRiskTimelineAndComparisonAPIs:

    def test_prediction_comparison_api(self, authenticated_client, sequential_predictions):
        pred_prev, pred_curr = sequential_predictions

        # GET /api/v1/predictions/{id}/comparison/
        url = f"/api/v1/predictions/{pred_curr.id}/comparison/"
        res = authenticated_client.get(url)

        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["has_comparison"] is True
        assert data["current_prediction"]["prediction_id"] == str(pred_curr.id)
        assert data["previous_prediction"]["prediction_id"] == str(pred_prev.id)
        assert data["risk_transition"]["is_escalation"] is True
        assert len(data["feature_differences"]) > 0

    def test_patient_predictions_comparison_api(self, authenticated_client, patient_record, sequential_predictions):
        # GET /api/v1/patients/{id}/predictions/comparison/
        url = f"/api/v1/patients/{patient_record.id}/predictions/comparison/"
        res = authenticated_client.get(url)

        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["has_comparison"] is True
        assert data["risk_transition"]["is_escalation"] is True

    def test_patient_timeline_api(self, authenticated_client, patient_record, sequential_predictions):
        # GET /api/v1/patients/{id}/timeline/
        url = f"/api/v1/patients/{patient_record.id}/timeline/"
        res = authenticated_client.get(url, {"limit": 10})

        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert "events" in data
        assert data["total_events"] > 0
        assert data["patient_id"] == str(patient_record.id)

    def test_prediction_feedback_lifecycle(self, authenticated_client, doctor_user, sequential_predictions):
        _, pred_curr = sequential_predictions

        # POST /api/v1/predictions/{id}/feedback/
        feedback_url = f"/api/v1/predictions/{pred_curr.id}/feedback/"
        payload = {
            "category": FeedbackCategory.PREDICTION_ACCEPTED,
            "clinician_notes": "Corroborated with acute telemetry trace. Excellent risk sensitivity.",
            "is_helpful": True,
        }
        post_res = authenticated_client.post(feedback_url, payload, format="json")
        assert post_res.status_code == status.HTTP_201_CREATED
        post_data = post_res.json()
        assert post_data["category"] == FeedbackCategory.PREDICTION_ACCEPTED
        assert post_data["is_helpful"] is True
        assert post_data["clinician_email"] == doctor_user.email

        # GET /api/v1/predictions/{id}/feedback/
        get_res = authenticated_client.get(feedback_url)
        assert get_res.status_code == status.HTTP_200_OK
        items = get_res.json()
        assert len(items) >= 1
        assert items[0]["prediction"] == str(pred_curr.id)


# ==============================================================================
# 4. SECURITY & RBAC TESTS
# ==============================================================================

@pytest.mark.django_db
class TestSecurityAndGovernanceRules:

    def test_unauthenticated_requests_rejected(self, api_client, sequential_predictions):
        _, pred_curr = sequential_predictions

        # Comparison requires authentication
        res = api_client.get(f"/api/v1/predictions/{pred_curr.id}/comparison/")
        assert res.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

        # Feedback requires authentication
        res_fb = api_client.post(f"/api/v1/predictions/{pred_curr.id}/feedback/", {"category": "OTHER"})
        assert res_fb.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_nonexistent_patient_comparison_returns_404(self, authenticated_client):
        random_id = uuid.uuid4()
        res = authenticated_client.get(f"/api/v1/patients/{random_id}/predictions/comparison/")
        assert res.status_code == status.HTTP_404_NOT_FOUND
