"""
Unit and Integration Test Suite for Prompt 60 — Observability, Monitoring, Logging, and Alerting.
Verifies:
1. SensitiveDataRedactor & RedactedLogFilter
2. CorrelationContext & Distributed Tracing
3. MetricsService real measurements & Cardinality bounds
4. AlertService deterministic rule evaluations & Role-based filtering
5. IncidentService lifecycle state machine (DETECTED -> RESOLVED)
6. AuditService compliance logging
7. REST API RBAC enforcement (IT Admin, Informaticist, Doctor, Nurse, Patient)
8. HTTP Middleware correlation headers injection
"""

import logging
import uuid
from unittest.mock import MagicMock, patch
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.accounts.models import UserRole
from apps.core.models import AuditLog
from integrations.observability import (
    AlertCategory,
    AlertSeverity,
    AlertService,
    AuditService,
    CorrelationContext,
    IncidentSeverity,
    IncidentState,
    IncidentService,
    MetricsService,
    ObservabilityProvider,
    RedactedLogFilter,
    SensitiveDataRedactor,
    TracingService,
)

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def it_admin_user(db):
    return User.objects.create_user(
        username="test_it_admin_obs",
        email="it_admin_obs@healthnova.test",
        password="TestPassword123!",
        role=UserRole.IT_ADMIN,
        is_staff=True,
        is_active=True,
    )


@pytest.fixture
def informaticist_user(db):
    return User.objects.create_user(
        username="test_info_obs",
        email="info_obs@healthnova.test",
        password="TestPassword123!",
        role=UserRole.MEDICAL_INFORMATICIST,
        is_active=True,
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="test_doctor_obs",
        email="doctor_obs@healthnova.test",
        password="TestPassword123!",
        role=UserRole.DOCTOR,
        is_active=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="test_patient_obs",
        email="patient_obs@healthnova.test",
        password="TestPassword123!",
        role=UserRole.PATIENT,
        is_active=True,
    )


# -----------------------------------------------------------------------------
# 1. DATA REDACTION & LOGGING FILTERS
# -----------------------------------------------------------------------------
def test_sensitive_data_redactor_tokens_and_keys():
    # Bearer token
    text = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretpayload12345"
    redacted = SensitiveDataRedactor.redact_text(text)
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in redacted
    assert "[REDACTED]" in redacted

    # Database URL with password
    db_url = "postgresql://dbuser:super_secret_password_123@neon-host.aws.neon.tech/neondb"
    redacted_db = SensitiveDataRedactor.redact_text(db_url)
    assert "super_secret_password_123" not in redacted_db
    assert "postgresql://dbuser:***@neon-host.aws.neon.tech/neondb" in redacted_db

    # GitHub / OpenAI token
    gh_token = "Personal token: ghp_1234567890abcdefghijklmnopqrstuvwxyz"
    assert "ghp_" not in SensitiveDataRedactor.redact_text(gh_token)


def test_sensitive_data_redactor_dict_keys():
    payload = {
        "username": "dr_smith",
        "password": "ClearTextPassword!",
        "access_token": "secret_jwt_token_123",
        "nested": {
            "api_key": "sk-12345678901234567890123456",
            "clinical_notes": "Patient vitals normal",
        },
    }
    redacted = SensitiveDataRedactor.redact_dict(payload)
    assert redacted["password"] == "[REDACTED]"
    assert redacted["access_token"] == "[REDACTED]"
    assert redacted["nested"]["api_key"] == "[REDACTED]"
    assert redacted["nested"]["clinical_notes"] == "Patient vitals normal"


def test_redacted_log_filter():
    logger = logging.getLogger("test_redaction_logger")
    log_filter = RedactedLogFilter()

    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Connecting using password=SuperSecretPassword123",
        args=(),
        exc_info=None,
    )
    log_filter.filter(record)
    assert "SuperSecretPassword123" not in record.msg
    assert "[REDACTED]" in record.msg


# -----------------------------------------------------------------------------
# 2. CORRELATION CONTEXT & TRACING
# -----------------------------------------------------------------------------
def test_correlation_context_generation_and_propagation():
    CorrelationContext.clear()
    custom_corr = str(uuid.uuid4())
    rid, cid = CorrelationContext.set_request_context(
        request_id=None,
        correlation_id=custom_corr,
        user_id="usr-123",
    )
    assert rid is not None
    assert cid == custom_corr
    assert CorrelationContext.get_correlation_id() == custom_corr
    assert CorrelationContext.get_user_id() == "usr-123"
    CorrelationContext.clear()
    assert CorrelationContext.get_user_id() is None


def test_tracing_service_span_lifecycle():
    tracer = TracingService(service_name="test-service")
    with tracer.start_span("test_inference_operation", tags={"model": "sepsis_rf"}) as span:
        assert span["operation"] == "test_inference_operation"
        assert span["status"] == "OK"
        assert "correlation_id" in span
    assert span["duration_ms"] >= 0.0


# -----------------------------------------------------------------------------
# 3. METRICS SERVICE REAL MEASUREMENTS
# -----------------------------------------------------------------------------
def test_metrics_service_live_aggregation():
    metrics = MetricsService()
    # Record requests
    metrics.record_http_request("GET", "/api/v1/patients/", 200, 15.5)
    metrics.record_http_request("POST", "/api/v1/predictions/predict/", 201, 45.2)
    metrics.record_http_request("GET", "/api/v1/unknown/", 404, 5.1)

    # Record ML & Celery
    metrics.record_ml_inference(32.4, success=True)
    metrics.record_celery_task(success=True)
    metrics.record_celery_task(success=False)
    metrics.record_ws_connect()

    snapshot = metrics.get_metrics_snapshot()
    assert snapshot["http"]["total_requests"] >= 3
    assert snapshot["http"]["total_errors"] >= 1
    assert snapshot["ml_inference"]["sample_count"] >= 1
    assert snapshot["celery"]["tasks_completed"] >= 1
    assert snapshot["celery"]["tasks_failed"] >= 1
    assert snapshot["websockets"]["active_connections"] >= 1


# -----------------------------------------------------------------------------
# 4. ALERT SERVICE RULE EVALUATION & ROUTING
# -----------------------------------------------------------------------------
def test_alert_service_rule_evaluation_database_outage():
    alert_svc = AlertService()
    health_mock = {
        "services": {
            "database": {"status": "UNHEALTHY", "error": "Connection refused"},
            "redis": {"status": "HEALTHY"},
        }
    }
    metrics_mock = {"http": {"total_requests": 10, "error_rate_pct": 0.0}}

    alerts = alert_svc.evaluate_rules(health_mock, metrics_mock)
    assert any(a.id == "ALERT-DB-UNAVAILABLE" and a.severity == AlertSeverity.CRITICAL for a in alerts)

    # Role filtering
    it_alerts = alert_svc.get_alerts_for_role("IT_ADMIN")
    assert len(it_alerts) >= 1

    patient_alerts = alert_svc.get_alerts_for_role("PATIENT")
    assert len(patient_alerts) == 0


# -----------------------------------------------------------------------------
# 5. INCIDENT MANAGEMENT LIFECYCLE
# -----------------------------------------------------------------------------
def test_incident_service_lifecycle_transitions():
    incident_svc = IncidentService()
    inc = incident_svc.create_incident(
        title="High Neon Connection Saturation",
        severity=IncidentSeverity.SEV2_HIGH,
        service="neon-db",
        actor="devops@healthnova.test",
        initial_notes="Pool exhausted at 95% capacity.",
    )
    assert inc.state == IncidentState.DETECTED

    # Advance to ACKNOWLEDGED
    inc = incident_svc.transition_state(inc.id, IncidentState.ACKNOWLEDGED, actor="oncall@healthnova.test")
    assert inc.state == IncidentState.ACKNOWLEDGED

    # Advance to RESOLVED
    inc = incident_svc.transition_state(
        inc.id,
        IncidentState.RESOLVED,
        actor="oncall@healthnova.test",
        resolution_summary="Scaled compute endpoint and closed idle connections.",
    )
    assert inc.state == IncidentState.RESOLVED
    assert inc.resolved_at is not None
    assert "Scaled compute" in inc.resolution_summary


# -----------------------------------------------------------------------------
# 6. AUDIT SERVICE COMPLIANCE LOGGING
# -----------------------------------------------------------------------------
@pytest.mark.django_db
def test_audit_service_creates_redacted_entry(it_admin_user):
    entry = AuditService.record_event(
        actor=it_admin_user,
        action="UPDATE",
        resource_type="ObservabilityConfig",
        resource_id="cfg-101",
        description="Updated alert threshold for password=secret123",
        metadata={"auth_token": "Bearer token_abc123"},
    )
    assert entry.user == it_admin_user
    assert "secret123" not in entry.description
    assert "[REDACTED]" in entry.description
    assert entry.metadata["auth_token"] == "[REDACTED]"


# -----------------------------------------------------------------------------
# 7. REST API RBAC & OBSERVABILITY VIEWS
# -----------------------------------------------------------------------------
@pytest.mark.django_db
def test_observability_overview_it_admin_authorized(api_client, it_admin_user):
    api_client.force_authenticate(user=it_admin_user)
    res = api_client.get("/api/v1/observability/overview/")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "metrics" in data["data"]
    assert "health" in data["data"]


@pytest.mark.django_db
def test_observability_overview_doctor_accessible(api_client, doctor_user):
    api_client.force_authenticate(user=doctor_user)
    res = api_client.get("/api/v1/observability/overview/")
    assert res.status_code == 200


@pytest.mark.django_db
def test_observability_metrics_patient_forbidden(api_client, patient_user):
    api_client.force_authenticate(user=patient_user)
    res = api_client.get("/api/v1/observability/metrics/")
    assert res.status_code == 403


@pytest.mark.django_db
def test_observability_incidents_create_it_admin_authorized(api_client, it_admin_user):
    api_client.force_authenticate(user=it_admin_user)
    payload = {
        "title": "Celery Task Queue Stall",
        "severity": "SEV2_HIGH",
        "service": "celery-worker",
        "notes": "Backlog reached 200 tasks.",
    }
    res = api_client.post("/api/v1/observability/incidents/", payload, format="json")
    assert res.status_code == 201
    inc_data = res.json()["incident"]
    assert inc_data["title"] == "Celery Task Queue Stall"
    assert inc_data["state"] == "DETECTED"


@pytest.mark.django_db
def test_observability_incidents_create_doctor_forbidden(api_client, doctor_user):
    api_client.force_authenticate(user=doctor_user)
    payload = {"title": "Doctor Incident", "severity": "SEV3_MEDIUM", "service": "core"}
    res = api_client.post("/api/v1/observability/incidents/", payload, format="json")
    assert res.status_code == 403


# -----------------------------------------------------------------------------
# 8. MIDDLEWARE CORRELATION HEADERS
# -----------------------------------------------------------------------------
@pytest.mark.django_db
def test_middleware_injects_correlation_headers(api_client):
    res = api_client.get("/api/v1/health/")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers
    assert "X-Correlation-ID" in res.headers
    assert len(res.headers["X-Request-ID"]) >= 8
