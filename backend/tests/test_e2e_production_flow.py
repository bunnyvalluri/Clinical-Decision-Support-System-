"""
Complete End-to-End Production Workflow Integration Test.

Validates the full 15-step clinical decision support lifecycle:
1. User registration (POST /api/v1/auth/register/)
2. Login & JWT issue (POST /api/v1/auth/token/)
3. Dashboard telemetry query (GET /api/v1/health/metrics/)
4. Patient admission / registration (POST /api/v1/patients/)
5. Clinical vital signs & encounter entry (POST /api/v1/patients/{id}/clinical-records/)
6. Risk prediction request (POST /api/v1/predictions/)
7. ML feature preprocessing
8. ML ensemble inference execution
9. Risk result generation & probability bounds
10. SHAP factor attribution & explainability (GET /api/v1/predictions/{id}/explanation/)
11. PostgreSQL persistence
12. Redis event dispatch
13. WebSocket event distribution
14. Prediction audit history retrieval (GET /api/v1/predictions/?patient={id})
15. Celery PDF report generation & completion notification (POST /api/v1/reports/ & task)
"""
from decimal import Decimal
import os
from pathlib import Path
from unittest.mock import MagicMock, patch
import uuid

import pytest
from channels.layers import channel_layers
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord, EncounterType
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.patients.models import BloodGroup, Gender, Patient
from apps.predictions.models import Prediction, PredictionExplanation, RiskLevel
from apps.reports.models import Report, ReportFormat, ReportStatus, ReportType
from apps.reports.tasks import generate_pdf_report_task
from services.model_loader import ModelLoaderService


@pytest.fixture(autouse=True)
def configure_test_environment(settings):
    """Set eager celery tasks and in-memory websocket channels."""
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = False
    settings.CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
    channel_layers.backends.clear()
    yield
    channel_layers.backends.clear()


@pytest.fixture(autouse=True)
def setup_active_ml_model(db):
    """Ensure active ML model is available in DB and ModelLoaderService cache."""
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


@pytest.mark.django_db
class TestEndToEndProductionWorkflow:
    def test_complete_clinical_lifecycle(self):
        client = APIClient()

        # =====================================================================
        # Step 1: User Registration
        # =====================================================================
        unique_suffix = uuid.uuid4().hex[:6]
        reg_payload = {
            "username": f"doc_{unique_suffix}",
            "email": f"dr.elena.{unique_suffix}@hospital.org",
            "password": "SecurePassword123!",
            "password_confirm": "SecurePassword123!",
            "first_name": "Elena",
            "last_name": "Vance",
            "role": "DOCTOR",
            "department": "Cardiology",
            "phone_number": "+15550001",
        }
        reg_response = client.post("/api/v1/auth/register/", reg_payload, format="json")
        assert reg_response.status_code == status.HTTP_201_CREATED
        assert reg_response.data["success"] is True
        user_id = reg_response.data["data"]["user"]["id"]
        assert user_id is not None

        # =====================================================================
        # Step 2: Login & JWT Issue
        # =====================================================================
        login_payload = {
            "email": f"dr.elena.{unique_suffix}@hospital.org",
            "password": "SecurePassword123!",
        }
        login_response = client.post("/api/v1/auth/token/", login_payload, format="json")
        assert login_response.status_code == status.HTTP_200_OK
        assert login_response.data["success"] is True
        access_token = login_response.data["data"]["access"]
        assert access_token is not None

        # Authenticate future requests using Bearer JWT
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # =====================================================================
        # Step 3: Dashboard Telemetry Retrieval
        # =====================================================================
        health_resp = client.get("/api/v1/health/")
        assert health_resp.status_code == status.HTTP_200_OK
        assert health_resp.data["data"]["status"] == "healthy"

        metrics_resp = client.get("/api/v1/health/metrics/")
        assert metrics_resp.status_code == status.HTTP_200_OK
        assert "api" in metrics_resp.data["data"]

        # =====================================================================
        # Step 4: Create Patient
        # =====================================================================
        patient_payload = {
            "first_name": "Eleanor",
            "last_name": "Ward",
            "date_of_birth": "1958-04-12",
            "gender": "FEMALE",
            "blood_group": "A+",
            "phone_number": "+15551234567",
            "email": f"eleanor.{unique_suffix}@hospital.org",
            "address": "452 Medical Parkway, Suite 100",
        }
        patient_resp = client.post("/api/v1/patients/", patient_payload, format="json")
        assert patient_resp.status_code == status.HTTP_201_CREATED
        patient_id = patient_resp.data["id"]
        assert patient_id is not None
        assert patient_resp.data["first_name"] == "Eleanor"

        # =====================================================================
        # Step 5: Add Clinical Data / Observation Record
        # =====================================================================
        clinical_payload = {
            "encounter_type": EncounterType.EMERGENCY,
            "systolic_bp": 172,
            "diastolic_bp": 104,
            "heart_rate": 118,
            "respiratory_rate": 26,
            "oxygen_saturation": "89.0",
            "body_temperature": "37.6",
            "glucose_level": "184.0",
            "cholesterol_total": "284.0",
            "bmi": "29.4",
            "creatinine": "1.45",
            "sodium": "138.0",
            "potassium": "4.2",
            "chief_complaint": "Acute retrosternal chest pain radiating to jaw",
            "clinical_notes": "Continuous bedside telemetry initiated in ICU-Bed-04.",
        }
        clinical_resp = client.post(
            f"/api/v1/patients/{patient_id}/clinical-records/",
            clinical_payload,
            format="json",
        )
        assert clinical_resp.status_code == status.HTTP_201_CREATED
        clinical_record_id = clinical_resp.data["id"]
        assert clinical_record_id is not None

        # =====================================================================
        # Step 6 to 10: Request Prediction -> Preprocessing -> Inference -> Result -> SHAP
        # =====================================================================
        pred_payload = {
            "patient_id": str(patient_id),
        }

        # Mock channel layer broadcast with AsyncMock to verify Redis dispatch and channel delivery
        with patch("channels.layers.get_channel_layer") as mock_channel_layer_getter:
            from unittest.mock import AsyncMock
            mock_layer = MagicMock()
            mock_layer.group_send = AsyncMock()
            mock_channel_layer_getter.return_value = mock_layer

            pred_resp = client.post("/api/v1/predictions/", pred_payload, format="json")
            assert pred_resp.status_code == status.HTTP_201_CREATED
            pred_data = pred_resp.json()

            # Step 8 & 9: Risk result generated
            prediction_id = pred_data["id"]
            risk_level = pred_data["prediction_result"]
            probability = pred_data["probability"]
            assert risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
            assert 0.0 <= float(probability) <= 1.0

            # Step 10: SHAP explanation generated
            explanation_resp = client.get(f"/api/v1/predictions/{prediction_id}/explanation/")
            assert explanation_resp.status_code == status.HTTP_200_OK
            explanation_data = explanation_resp.json()
            assert "features" in explanation_data or "top_risk_factors" in explanation_data or "top_features" in explanation_data
            assert "disclaimer" in explanation_data

            # =====================================================================
            # Step 11: PostgreSQL Persistence Verification
            # =====================================================================
            pred_in_db = Prediction.objects.get(id=prediction_id)
            assert str(pred_in_db.patient_id) == str(patient_id)
            assert pred_in_db.prediction_result == risk_level

            # =====================================================================
            # Step 12 & 13: Redis Event & WebSocket Channel Broadcast
            # =====================================================================
            assert mock_layer.group_send.called
            calls = [call[0] for call in mock_layer.group_send.call_args_list]
            group_names = [call[0] for call in calls]
            assert any("dashboard" in g or "risk_alerts" in g or "patient" in g or "notifications" in g for g in group_names)

        # =====================================================================
        # Step 14: Prediction History Query
        # =====================================================================
        history_resp = client.get(f"/api/v1/predictions/?patient={patient_id}")
        assert history_resp.status_code == status.HTTP_200_OK
        history_json = history_resp.json()
        if isinstance(history_json, dict) and "data" in history_json:
            inner = history_json["data"]
            if isinstance(inner, dict) and "results" in inner:
                history_records = inner["results"]
            elif isinstance(inner, list):
                history_records = inner
            else:
                history_records = [inner]
        elif isinstance(history_json, dict) and "results" in history_json:
            history_records = history_json["results"]
        elif isinstance(history_json, list):
            history_records = history_json
        else:
            history_records = []
        assert len(history_records) >= 1
        assert any(str(r["id"]) == str(prediction_id) for r in history_records)

        # =====================================================================
        # Step 15: Generate Report & Asynchronous Celery Completion
        # =====================================================================
        report_payload = {
            "patient_id": str(patient_id),
            "prediction_id": str(prediction_id),
            "report_type": ReportType.DISCHARGE_SUMMARY,
            "format": ReportFormat.PDF,
        }
        with patch("apps.reports.views.broadcast_task_status") as mock_broadcast:
            report_create_resp = client.post("/api/v1/reports/", report_payload, format="json")
            assert report_create_resp.status_code == status.HTTP_202_ACCEPTED
            report_data = report_create_resp.json()
            task_id = report_data["task_id"]
            report_id = report_data["report_id"]
            assert report_data["status"] == "QUEUED"
            assert mock_broadcast.called

        # Verify report in DB is marked COMPLETED by eager Celery worker
        report_in_db = Report.objects.get(id=report_id)
        assert report_in_db.status == ReportStatus.COMPLETED
        assert report_in_db.file_path is not None
        assert os.path.exists(report_in_db.file_path)

        # Verify PDF report download endpoint returns 200 OK and PDF file content
        download_resp = client.get(f"/api/v1/reports/{report_id}/download/")
        assert download_resp.status_code == status.HTTP_200_OK
        assert download_resp["Content-Type"] == "application/pdf"
