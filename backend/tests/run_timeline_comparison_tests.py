"""
Direct execution runner for Patient Risk Timeline, Prediction Comparison, and Feedback Loop tests.
Runs all test cases within atomic transactions, ensuring 100% test validation and clean teardown.
"""

import os
import sys
import uuid
from decimal import Decimal

# Set up Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
import django
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.clinical.models import ClinicalAlert, ClinicalRecord, Escalation, PatientTimelineEvent
from apps.model_registry.models import ModelVersion
from apps.patients.models import Patient
from apps.predictions.models import (
    FeedbackCategory,
    Prediction,
    PredictionExplanation,
    PredictionFeedback,
    RiskLevel,
)
from services.prediction_comparison_service import PredictionComparisonService
from services.timeline_service import PatientTimelineService

User = get_user_model()


def run_all_tests():
    print("=" * 80)
    print("RUNNING PATIENT RISK TIMELINE, COMPARISON & FEEDBACK TEST SUITE")
    print("Authoritative Store: Neon PostgreSQL")
    print("=" * 80)

    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            print(f"  [PASS] {name}")
            passed += 1
        else:
            print(f"  [FAIL] {name} - {details}")
            raise AssertionError(f"Test failed: {name} - {details}")

    # Create atomic block for test isolation
    with transaction.atomic():
        try:
            # -------------------------------------------------------------
            # SETUP FIXTURES
            # -------------------------------------------------------------
            print("\n--- 1. Setting Up Test Fixtures ---")
            doctor_user = User.objects.create_user(
                username=f"dr_test_{uuid.uuid4().hex[:6]}",
                email=f"dr.test.{uuid.uuid4().hex[:6]}@hospital.org",
                password="DoctorPassword123!",
                role="DOCTOR",
                first_name="Marcus",
                last_name="Welby",
            )
            print(f"  Created test doctor: {doctor_user.email}")

            patient = Patient.objects.create(
                first_name="Eleanor",
                last_name="Rigby",
                date_of_birth="1972-03-24",
                gender="FEMALE",
                mrn=f"MRN-TEST-{uuid.uuid4().hex[:6].upper()}",
                is_active=True,
            )
            print(f"  Created test patient: MRN={patient.mrn}")

            model_ver, _ = ModelVersion.objects.get_or_create(
                model_name="HeartFailure-XGB",
                version="2.1.0",
                defaults={
                    "algorithm": "XGBoost",
                    "status": "ACTIVE",
                    "artifact_location": "s3://models/hf_xgb_v2.1.joblib",
                    "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                },
            )

            # Prediction 1: LOW Risk (3 days ago)
            t_prev = timezone.now() - timezone.timedelta(days=3)
            rec_prev = ClinicalRecord.objects.create(
                patient=patient,
                recorded_at=t_prev,
                systolic_bp=120,
                diastolic_bp=78,
                heart_rate=72,
                oxygen_saturation=Decimal("98.0"),
                glucose_level=Decimal("95.0"),
            )
            pred_prev = Prediction.objects.create(
                patient=patient,
                clinical_record=rec_prev,
                model_version=model_ver,
                model_name=model_ver.model_name,
                model_version_str=model_ver.version,
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
            PredictionExplanation.objects.create(
                prediction=pred_prev,
                method="TreeSHAP",
                baseline_value=0.25,
                feature_importances={
                    "systolic_bp": 0.05,
                    "heart_rate": 0.04,
                },
            )

            # Prediction 2: HIGH Risk (1 hour ago)
            t_curr = timezone.now() - timezone.timedelta(hours=1)
            rec_curr = ClinicalRecord.objects.create(
                patient=patient,
                recorded_at=t_curr,
                systolic_bp=168,
                diastolic_bp=102,
                heart_rate=114,
                oxygen_saturation=Decimal("91.0"),
                glucose_level=Decimal("155.0"),
            )
            pred_curr = Prediction.objects.create(
                patient=patient,
                clinical_record=rec_curr,
                model_version=model_ver,
                model_name=model_ver.model_name,
                model_version_str=model_ver.version,
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
            PredictionExplanation.objects.create(
                prediction=pred_curr,
                method="TreeSHAP",
                baseline_value=0.25,
                feature_importances={
                    "systolic_bp": 0.38,
                    "heart_rate": 0.22,
                    "oxygen_saturation": 0.18,
                },
            )

            # -------------------------------------------------------------
            # TEST GROUP 1: PREDICTION COMPARISON SERVICE
            # -------------------------------------------------------------
            print("\n--- 2. Testing PredictionComparisonService ---")
            current = PredictionComparisonService.get_current_patient_prediction(patient.id)
            assert_test("Current Prediction is Latest", current is not None and current.id == pred_curr.id)

            prev = PredictionComparisonService.get_previous_patient_prediction(patient.id, pred_curr.id)
            assert_test("Previous Prediction is Correct Prior Inference", prev is not None and prev.id == pred_prev.id)

            comp = PredictionComparisonService.compare_patient_predictions(
                current_pred=pred_curr,
                previous_pred=pred_prev,
            )
            assert_test("Comparison is_initial_prediction == False", comp["is_initial_prediction"] is False)
            assert_test("Risk Transition detected LOW -> HIGH", comp["risk_transition"] == "LOW -> HIGH")
            assert_test("Transition Direction is ESCALATION", comp["transition_direction"] == "ESCALATION")
            assert_test("Risk Changed == True", comp["risk_changed"] is True)

            feature_diffs = {f["feature"]: f for f in comp["feature_changes"]}
            assert_test("Feature Difference includes systolic_bp", "systolic_bp" in feature_diffs)
            sbp = feature_diffs["systolic_bp"]
            assert_test("Systolic BP Delta is +48.0 mmHg", sbp["delta"] == 48.0)
            assert_test("Systolic BP % Change is +40.0%", sbp["percentage_change"] == 40.0)
            assert_test("Systolic BP Clinical Significance is True", sbp["is_significant"] is True)

            shap_div = comp.get("shap_divergence", {})
            assert_test("SHAP Divergence available", shap_div.get("available") is True)
            shap_factors = {s["feature"]: s for s in shap_div.get("shifted_factors", [])}
            assert_test("SHAP Divergence includes systolic_bp", "systolic_bp" in shap_factors)
            assert_test("Systolic BP Current Importance is 0.38", shap_factors["systolic_bp"]["current_shap"] == 0.38)
            assert_test("Systolic BP Shift > 0", shap_factors["systolic_bp"]["shap_shift"] > 0)

            # -------------------------------------------------------------
            # TEST GROUP 2: CLINICAL ALERT & ESCALATION AUTO-TRIGGER
            # -------------------------------------------------------------
            assert_test("Alert generated in comparison payload", len(comp.get("alerts_generated", [])) > 0)
            alerts = ClinicalAlert.objects.filter(patient=patient)
            assert_test("ClinicalAlert persisted in database", alerts.exists())
            if alerts.exists():
                alert = alerts.first()
                assert_test("Alert references risk escalation", "escalated" in alert.message.lower() or "risk" in alert.message.lower())

            # -------------------------------------------------------------
            # TEST GROUP 3: PATIENT TIMELINE SERVICE & ROLE SCOPING
            # -------------------------------------------------------------
            print("\n--- 4. Testing PatientTimelineService & Phase 3 Taxonomy ---")
            # Create a clinical staff audit event
            PatientTimelineEvent.objects.create(
                patient=patient,
                event_type=PatientTimelineEvent.EventType.DATA_QUALITY_EVENT,
                title="Sensor Noise Artifact Excluded",
                description="Raw PPG signal noise detected and filtered.",
                actor="SYSTEM",
                source="PIPELINE",
                severity="NORMAL",
                authorization_scope="CLINICAL_STAFF",
            )

            # Create a patient portal event
            PatientTimelineEvent.objects.create(
                patient=patient,
                event_type=PatientTimelineEvent.EventType.ENCOUNTER,
                title="Cardiology Outpatient Follow-up",
                description="Routine follow-up appointment.",
                actor="staff@hospital.org",
                source="EHR",
                severity="NORMAL",
                authorization_scope="PUBLIC_PATIENT",
            )

            # Doctor timeline
            doc_events = PatientTimelineService.get_timeline_for_patient(
                patient_id=patient.id,
                user_role="DOCTOR",
                max_events=50,
            )
            doc_titles = [e["title"] for e in doc_events]
            assert_test("Doctor timeline includes CLINICAL_STAFF event", "Sensor Noise Artifact Excluded" in doc_titles)
            assert_test("Doctor timeline includes PUBLIC_PATIENT event", "Cardiology Outpatient Follow-up" in doc_titles)

            # Chronological sort check
            is_sorted = all(doc_events[i]["timestamp"] >= doc_events[i + 1]["timestamp"] for i in range(len(doc_events) - 1))
            assert_test("Timeline events are strictly sorted newest first", is_sorted)

            # Patient portal timeline
            patient_events = PatientTimelineService.get_timeline_for_patient(
                patient_id=patient.id,
                user_role="USER",
                max_events=50,
            )
            patient_titles = [e["title"] for e in patient_events]
            assert_test("Patient portal hides CLINICAL_STAFF events", "Sensor Noise Artifact Excluded" not in patient_titles)
            assert_test("Patient portal retains patient-friendly events", "Cardiology Outpatient Follow-up" in patient_titles)

            # -------------------------------------------------------------
            # TEST GROUP 4: REST API ENDPOINTS
            # -------------------------------------------------------------
            print("\n--- 5. Testing REST API Endpoints via APIClient ---")
            client = APIClient()
            client.force_authenticate(user=doctor_user)

            # GET /api/v1/predictions/{id}/comparison/
            res_comp = client.get(f"/api/v1/predictions/{pred_curr.id}/comparison/")
            assert_test("GET /api/v1/predictions/{id}/comparison/ returns 200", res_comp.status_code == status.HTTP_200_OK)
            data_comp = res_comp.json()
            assert_test("Comparison API payload has_comparison == True", data_comp.get("has_comparison") is True)

            # GET /api/v1/patients/{id}/predictions/comparison/
            res_pat_comp = client.get(f"/api/v1/patients/{patient.id}/predictions/comparison/")
            assert_test("GET /api/v1/patients/{id}/predictions/comparison/ returns 200", res_pat_comp.status_code == status.HTTP_200_OK)

            # GET /api/v1/patients/{id}/timeline/
            res_tl = client.get(f"/api/v1/patients/{patient.id}/timeline/", {"limit": 10})
            assert_test("GET /api/v1/patients/{id}/timeline/ returns 200", res_tl.status_code == status.HTTP_200_OK)
            data_tl = res_tl.json()
            assert_test("Timeline API payload contains events", len(data_tl.get("events", [])) > 0)

            # POST /api/v1/predictions/{id}/feedback/
            res_fb_post = client.post(
                f"/api/v1/predictions/{pred_curr.id}/feedback/",
                {
                    "feedback_category": FeedbackCategory.PREDICTION_ACCEPTED,
                    "comments": "Prompt telemetry detection of acute hypertensive episode.",
                },
                format="json",
            )
            assert_test("POST /api/v1/predictions/{id}/feedback/ returns 201", res_fb_post.status_code == status.HTTP_201_CREATED)

            # GET /api/v1/predictions/{id}/feedback/
            res_fb_get = client.get(f"/api/v1/predictions/{pred_curr.id}/feedback/")
            assert_test("GET /api/v1/predictions/{id}/feedback/ returns 200", res_fb_get.status_code == status.HTTP_200_OK)
            data_fb = res_fb_get.json()
            fb_list = data_fb.get("data", data_fb) if isinstance(data_fb, dict) else data_fb
            assert_test("Feedback list contains submitted feedback", len(fb_list) >= 1)

            # -------------------------------------------------------------
            # TEST GROUP 5: SECURITY & RBAC
            # -------------------------------------------------------------
            print("\n--- 6. Testing Security & Authorization ---")
            unauth_client = APIClient()
            res_unauth = unauth_client.get(f"/api/v1/predictions/{pred_curr.id}/comparison/")
            assert_test("Unauthenticated comparison request rejected (401/403)", res_unauth.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

            res_404 = client.get(f"/api/v1/patients/{uuid.uuid4()}/predictions/comparison/")
            assert_test("Nonexistent patient returns 404", res_404.status_code == status.HTTP_404_NOT_FOUND)

        finally:
            # Clean rollback ensures no test data leaks into production Neon DB
            transaction.set_rollback(True)
            print("\n[CLEANUP] Transaction rollback executed: zero residual test data.")

    print("\n" + "=" * 80)
    print(f"RESULTS: {passed}/{total} TESTS PASSED (100% SUCCESS RATE)")
    print("=" * 80)
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
