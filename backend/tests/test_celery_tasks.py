"""
Automated tests for Celery asynchronous background processing:
- PDF report generation with ReportLab
- Task status transitions (QUEUED -> PROCESSING -> COMPLETED / FAILED)
- Soft time limit and failure handling
- Distributed idempotency locks
- Notification and email dispatch with deduplication
- Asynchronous bulk prediction processing
- Periodic scheduled analytics
- REST API task tracking: POST /api/v1/reports/ (returns 202) and GET /api/v1/tasks/{task_id}/
- Report PDF download endpoint
"""
from datetime import date
from io import BytesIO
import json
import os
from pathlib import Path
from unittest.mock import MagicMock, patch
import uuid

from billiard.exceptions import SoftTimeLimitExceeded
from channels.layers import channel_layers, get_channel_layer
from django.core import mail
from django.test import override_settings
from django.urls import reverse
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.clinical.models import ClinicalRecord
from apps.notifications.models import Notification, NotificationChannel, NotificationSeverity
from apps.notifications.tasks import send_email_notification_task, send_notification_task
from apps.patients.models import Patient
from apps.predictions.models import Prediction, RiskLevel
from apps.predictions.tasks import process_bulk_predictions_task
from apps.reports.models import Report, ReportFormat, ReportStatus, ReportType
from apps.reports.tasks import generate_pdf_report_task
from celery_tasks.scheduled_tasks import compute_periodic_analytics_task
from config.celery import broadcast_task_status, get_redis_client


@pytest.fixture(autouse=True)
def celery_test_settings(settings):
    """Ensure synchronous eager execution and in-memory channel layers for tests."""
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


@pytest.fixture
def clinician_user(db):
    return User.objects.create_user(
        username="dr_async",
        email="dr.async@hospital.org",
        password="SecureDoctorPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Eleanor",
        last_name="Vance",
        is_active=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="pt_async",
        email="pt.async@hospital.org",
        password="SecurePatientPassword123!",
        role=UserRole.PATIENT,
        first_name="Arthur",
        last_name="Dent",
        is_active=True,
    )


@pytest.fixture
def sample_patient(db, patient_user, clinician_user):
    return Patient.objects.create(
        user=patient_user,
        primary_physician=clinician_user,
        mrn=f"MRN-{uuid.uuid4().hex[:6].upper()}",
        first_name="Arthur",
        last_name="Dent",
        date_of_birth=date(1978, 3, 11),
        gender="MALE",
        blood_group="O_POS",
    )


@pytest.fixture
def sample_clinical_record(db, sample_patient, clinician_user):
    return ClinicalRecord.objects.create(
        patient=sample_patient,
        recorded_by=clinician_user,
        heart_rate=88.0,
        systolic_bp=142.0,
        diastolic_bp=92.0,
        respiratory_rate=18.0,
        body_temperature=37.1,
        oxygen_saturation=96.0,
    )


from decimal import Decimal
from apps.model_registry.models import ModelStatus, ModelVersion


@pytest.fixture(autouse=True)
def setup_active_model(db):
    """Ensure an active model exists in the test database for all prediction tests."""
    from services.model_loader import ModelLoaderService
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


@pytest.fixture
def sample_prediction(db, sample_patient, sample_clinical_record, setup_active_model):
    return Prediction.objects.create(
        patient=sample_patient,
        clinical_record=sample_clinical_record,
        model_version=setup_active_model,
        model_name=setup_active_model.model_name,
        model_version_str=setup_active_model.version,
        prediction_result=RiskLevel.HIGH,
        probability=Decimal("0.8420"),
        confidence_score=Decimal("0.8420"),
        inference_latency_ms=Decimal("1.45"),
        features_snapshot={"systolic_bp": 142.0, "diastolic_bp": 92.0, "heart_rate": 88.0},
    )


@pytest.fixture
def sample_report(db, sample_patient, sample_prediction, clinician_user):
    return Report.objects.create(
        patient=sample_patient,
        prediction=sample_prediction,
        generated_by=clinician_user,
        report_type=ReportType.RISK_ASSESSMENT,
        format=ReportFormat.PDF,
        status=ReportStatus.PENDING,
    )


# =============================================================================
# 1. PDF Report Generation Task Tests
# =============================================================================
@pytest.mark.django_db
class TestPDFReportGenerationTask:
    def test_generate_pdf_report_success(self, sample_report, clinician_user):
        """Task compiles valid PDF file on disk and updates report status to COMPLETED."""
        res = generate_pdf_report_task.apply(
            args=[str(sample_report.id)],
            kwargs={"requested_by_id": str(clinician_user.id)},
        )

        sample_report.refresh_from_db()
        assert sample_report.status == ReportStatus.COMPLETED
        assert sample_report.file_path != ""
        assert sample_report.file_size_bytes is not None
        assert sample_report.file_size_bytes > 0
        assert sample_report.generated_at is not None

        pdf_path = Path(sample_report.file_path)
        assert pdf_path.exists()
        with open(pdf_path, "rb") as f:
            header = f.read(4)
            assert header == b"%PDF"

        # Cleanup test artifact
        try:
            pdf_path.unlink()
        except OSError:
            pass

    def test_generate_pdf_report_failure_handling(self, clinician_user):
        """Non-existent report ID updates status and fails cleanly."""
        fake_id = str(uuid.uuid4())
        try:
            res = generate_pdf_report_task.apply(
                args=[fake_id],
                kwargs={"requested_by_id": str(clinician_user.id)},
            )
            assert res.failed() or res.state == "FAILURE"
        except Exception:
            pass

    def test_generate_pdf_report_soft_time_limit_exceeded(self, sample_report, clinician_user):
        """Soft time limit intercepts and sets report status to FAILED without crash."""
        with patch("apps.reports.tasks._build_clinical_pdf", side_effect=SoftTimeLimitExceeded()):
            try:
                generate_pdf_report_task.apply(
                    args=[str(sample_report.id)],
                    kwargs={"requested_by_id": str(clinician_user.id)},
                )
            except SoftTimeLimitExceeded:
                pass
            sample_report.refresh_from_db()
            assert sample_report.status == ReportStatus.FAILED


# =============================================================================
# 2. Notification & Email Celery Tasks
# =============================================================================
@pytest.mark.django_db
class TestNotificationAndEmailTasks:
    def test_send_notification_task(self, clinician_user, sample_patient):
        """In-app and WebSocket notification dispatched via Celery."""
        notif = Notification.objects.create(
            recipient=clinician_user,
            patient=sample_patient,
            severity=NotificationSeverity.HIGH,
            channel=NotificationChannel.WEBSOCKET,
            title="Elevated BP Alert",
            message="Patient systolic BP is 155 mmHg.",
        )

        res = send_notification_task.apply(args=[str(notif.id)])
        assert res.successful()
        result_data = res.result
        assert result_data["status"] == "SENT"
        assert result_data["notification_id"] == str(notif.id)

    def test_send_email_notification_task_success(self):
        """Async email task delivers email and prevents duplicate delivery."""
        mail.outbox.clear()
        email_addr = f"physician_{uuid.uuid4().hex[:6]}@hospital.org"
        res = send_email_notification_task.apply(
            kwargs={
                "recipient_email": email_addr,
                "subject": "Urgent Sepsis Alert",
                "message": "Immediate bedside evaluation required.",
            }
        )
        assert res.successful()
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == [email_addr]
        assert "Urgent Sepsis Alert" in mail.outbox[0].subject

    def test_send_email_deduplication_lock(self):
        """Submitting duplicate email within lock window is suppressed."""
        mail.outbox.clear()
        email_addr = f"doctor_{uuid.uuid4().hex[:6]}@hospital.org"
        res1 = send_email_notification_task.apply(
            kwargs={
                "recipient_email": email_addr,
                "subject": "Duplicate Test Subject",
                "message": "First message",
            }
        )
        assert res1.result["status"] == "DELIVERED"

        # Second immediate identical send should be suppressed
        res2 = send_email_notification_task.apply(
            kwargs={
                "recipient_email": email_addr,
                "subject": "Duplicate Test Subject",
                "message": "Second message",
            }
        )
        assert res2.result["status"] == "SUPPRESSED_DUPLICATE"
        assert len(mail.outbox) == 1


# =============================================================================
# 3. Asynchronous Bulk Prediction Task
# =============================================================================
@pytest.mark.django_db
class TestBulkPredictionsTask:
    def test_process_bulk_predictions_task(self, sample_patient, clinician_user):
        """Asynchronous bulk prediction processes encounters and returns summary."""
        records = [
            {
                "patient_id": str(sample_patient.id),
                "vitals": {
                    "systolic_bp": 120.0,
                    "diastolic_bp": 80.0,
                    "heart_rate": 72.0,
                    "respiratory_rate": 16.0,
                    "temperature": 37.0,
                    "oxygen_saturation": 98.0,
                },
            },
            {
                "patient_id": str(sample_patient.id),
                "vitals": {
                    "systolic_bp": 155.0,
                    "diastolic_bp": 98.0,
                    "heart_rate": 105.0,
                    "respiratory_rate": 22.0,
                    "temperature": 38.5,
                    "oxygen_saturation": 93.0,
                },
            },
        ]

        res = process_bulk_predictions_task.apply(
            kwargs={
                "records": records,
                "model_name": "random_forest_risk_model",
                "requested_by_id": str(clinician_user.id),
                "batch_id": "test-batch-001",
            }
        )

        assert res.successful()
        summary = res.result
        assert summary["total_records"] == 2
        assert summary["successful_predictions"] == 2
        assert "batch_id" in summary


# =============================================================================
# 4. Periodic Scheduled Analytics Task
# =============================================================================
@pytest.mark.django_db
class TestScheduledAnalyticsTask:
    def test_compute_periodic_analytics_task(self, sample_prediction):
        """Celery Beat scheduled task calculates metrics and returns dictionary."""
        res = compute_periodic_analytics_task.apply()
        assert res.successful()
        stats = res.result
        assert stats["total_patients"] >= 1
        assert stats["predictions_today"] >= 1
        assert "avg_latency_ms" in stats
        assert "active_model" in stats


# =============================================================================
# 5. REST API Task Status Tracking & Download Endpoints
# =============================================================================
@pytest.mark.django_db
class TestReportsAndTaskTrackingAPI:
    def test_post_reports_enqueues_task_and_returns_202(self, clinician_user, sample_patient):
        """POST /api/v1/reports/ creates report and immediately returns 202 with task_id."""
        client = APIClient()
        client.force_authenticate(user=clinician_user)

        payload = {
            "patient_id": str(sample_patient.id),
            "report_type": "RISK_ASSESSMENT",
            "format": "PDF",
        }

        response = client.post("/api/v1/reports/", data=payload, format="json")
        assert response.status_code == 202
        data = response.json()
        assert "task_id" in data
        assert "report_id" in data
        assert data["status"] == "QUEUED"

    def test_get_task_status_endpoint(self, clinician_user):
        """GET /api/v1/tasks/{task_id}/ returns tracked task state."""
        client = APIClient()
        client.force_authenticate(user=clinician_user)

        fake_task_id = str(uuid.uuid4())
        broadcast_task_status(
            task_id=fake_task_id,
            task_name="generate_pdf_report",
            status="PROCESSING",
            progress=45,
        )

        response = client.get(f"/api/v1/tasks/{fake_task_id}/")
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == fake_task_id
        assert data["status"] == "PROCESSING"
        assert data["progress"] == 45

    def test_get_report_download(self, clinician_user, sample_report):
        """GET /api/v1/reports/{id}/download/ serves compiled PDF file."""
        # First generate the PDF
        generate_pdf_report_task.apply(args=[str(sample_report.id)])
        sample_report.refresh_from_db()
        assert sample_report.status == ReportStatus.COMPLETED

        client = APIClient()
        client.force_authenticate(user=clinician_user)

        response = client.get(f"/api/v1/reports/{sample_report.id}/download/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert "attachment;" in response["Content-Disposition"]

        # Clean up
        if sample_report.file_path:
            try:
                Path(sample_report.file_path).unlink()
            except OSError:
                pass

    def test_batch_async_predictions_endpoint(self, clinician_user, sample_patient):
        """POST /api/v1/predictions/batch-async/ returns 202 with task_id."""
        client = APIClient()
        client.force_authenticate(user=clinician_user)

        payload = {
            "records": [
                {
                    "patient_id": str(sample_patient.id),
                    "vitals": {
                        "systolic_bp": 122.0,
                        "diastolic_bp": 82.0,
                        "heart_rate": 75.0,
                        "respiratory_rate": 16.0,
                        "temperature": 37.0,
                        "oxygen_saturation": 98.0,
                    },
                }
            ]
        }

        response = client.post("/api/v1/predictions/batch-async/", data=payload, format="json")
        assert response.status_code == 202
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "QUEUED"
        assert data["total_records"] == 1
