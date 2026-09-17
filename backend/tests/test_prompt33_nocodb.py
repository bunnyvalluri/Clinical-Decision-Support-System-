"""
Unit and integration tests for Prompt 33 — NocoDB Healthcare Integration.
Validates:
- Dataset and Schema Column generation
- Role-based access control and boundary enforcement
- PHI Redaction and de-identification
- SSRF prevention against link-local and cloud metadata
- Spreadsheet formula injection sanitization
- Model Context Protocol (MCP) tool execution
- Immutable audit trail generation
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import APIClient

from apps.accounts.models import UserRole
from apps.nocodb.models import (
    NocoDBDataset,
    NocoDBSchemaColumn,
    NocoDBRowRecord,
    NocoDBAuditEvent,
    NocoDBConnection,
)
from apps.nocodb.security import (
    is_ssrf_safe_url,
    sanitize_cell_value,
    verify_webhook_hmac,
    redact_phi_fields,
)
from apps.nocodb.services.schema_service import SchemaService
from apps.nocodb.services.sync_service import SyncService
from apps.nocodb.services.dataset_service import DatasetService
from apps.nocodb.services.integration_service import IntegrationService
from apps.nocodb.services.mcp_gateway import NocoDBMCPGateway


User = get_user_model()


@pytest.fixture
def informaticist_user(db):
    return User.objects.create_user(
        username="informaticist_test",
        email="informaticist@healthnova.test",
        password="TestPassword123!",
        role=UserRole.MEDICAL_INFORMATICIST,
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="doctor_test",
        email="doctor@healthnova.test",
        password="TestPassword123!",
        role=UserRole.DOCTOR,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="patient_test",
        email="patient@healthnova.test",
        password="TestPassword123!",
        role=UserRole.PATIENT,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username="admin_test",
        email="admin@healthnova.test",
        password="TestPassword123!",
        role=UserRole.IT_ADMIN,
    )


@pytest.mark.django_db
class TestNocoDBSchemaAndSync:
    def test_schema_service_initializes_standard_datasets(self):
        datasets = SchemaService.ensure_standard_datasets()
        assert len(datasets) >= 6
        slugs = {d.slug for d in datasets}
        assert "ml_predictions_monitoring" in slugs
        assert "model_eval_registry" in slugs
        assert "feature_drift_ledger" in slugs
        assert "data_quality_queue" in slugs

        pred_ds = NocoDBDataset.objects.get(slug="ml_predictions_monitoring")
        cols = {c.name for c in pred_ds.columns.all()}
        assert "anon_patient_token" in cols
        assert "risk_score" in cols
        assert "risk_tier" in cols

    def test_sync_service_populates_datasets(self):
        SchemaService.ensure_standard_datasets()
        results = SyncService.sync_all_datasets()
        assert results["ml_predictions"] > 0
        assert results["model_evaluations"] > 0
        assert results["feature_drift"] > 0

        pred_ds = NocoDBDataset.objects.get(slug="ml_predictions_monitoring")
        assert pred_ds.row_count > 0
        assert NocoDBRowRecord.objects.filter(dataset=pred_ds).count() > 0


@pytest.mark.django_db
class TestNocoDBSecurityControls:
    def test_ssrf_prevention(self):
        # Cloud metadata blocked
        assert not is_ssrf_safe_url("http://169.254.169.254/latest/meta-data")
        assert not is_ssrf_safe_url("http://metadata.google.internal/computeMetadata/v1")
        # Non http/https blocked
        assert not is_ssrf_safe_url("file:///etc/passwd")
        assert not is_ssrf_safe_url("gopher://127.0.0.1:8080")
        # Allowed internal container
        assert is_ssrf_safe_url("http://nocodb:8080", allow_internal_nocodb=True)

    def test_spreadsheet_formula_injection_sanitization(self):
        malicious_vals = [
            "=SUM(1+1)",
            "-1+cmd|' /C calc'!A0",
            "+cmd|' /C calc'!A0",
            "@SUM(1,2)",
            "\tHYPERLINK(\"http://evil.com\")",
        ]
        for val in malicious_vals:
            sanitized = sanitize_cell_value(val)
            assert sanitized.startswith("'"), f"Failed for {val}"

        # Safe values unmodified
        assert sanitize_cell_value("Normal Text") == "Normal Text"
        assert sanitize_cell_value(123.45) == 123.45

    def test_webhook_hmac_verification(self):
        secret = "secret_test_key"
        payload = b'{"event":"row.insert","dataset":"ml_predictions"}'
        import hmac, hashlib
        sig = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        assert verify_webhook_hmac(payload, sig, secret)
        assert not verify_webhook_hmac(payload, "invalid_sig", secret)

    def test_phi_redaction(self):
        record = {
            "id": 1,
            "patient_name": "Jane Doe",
            "risk_score": 0.82,
            "dob": "1980-01-01",
        }
        redacted = redact_phi_fields(record, is_admin=False)
        assert redacted["patient_name"] == "[REDACTED_PHI]"
        assert redacted["dob"] == "[REDACTED_PHI]"
        assert redacted["risk_score"] == 0.82

        # Admin retains access
        unredacted = redact_phi_fields(record, is_admin=True)
        assert unredacted["patient_name"] == "Jane Doe"


@pytest.mark.django_db
class TestNocoDBEndpointsAndRBAC:
    def test_informaticist_can_view_and_export(self, informaticist_user):
        SchemaService.ensure_standard_datasets()
        SyncService.sync_all_datasets()
        client = APIClient()
        client.force_authenticate(user=informaticist_user)

        # Datasets list
        resp = client.get("/api/v1/nocodb/datasets/")
        assert resp.status_code == 200
        assert len(resp.data) >= 4

        # Rows query
        resp_rows = client.get("/api/v1/nocodb/datasets/ml_predictions_monitoring/rows/")
        assert resp_rows.status_code == 200
        assert "rows" in resp_rows.data
        assert resp_rows.data["total_rows"] > 0

        # CSV export with sanitization
        resp_export = client.get("/api/v1/nocodb/datasets/ml_predictions_monitoring/export/")
        assert resp_export.status_code == 200
        assert resp_export["Content-Type"].startswith("text/csv")

        # Verify audit log recorded
        assert NocoDBAuditEvent.objects.filter(user=informaticist_user, action="VIEW").exists()

    def test_patient_blocked_from_internal_mlops_datasets(self, patient_user):
        SchemaService.ensure_standard_datasets()
        client = APIClient()
        client.force_authenticate(user=patient_user)

        # Patient cannot query MLOps drift ledger
        resp = client.get("/api/v1/nocodb/datasets/feature_drift_ledger/rows/")
        assert resp.status_code == 403

    def test_mcp_gateway_tool_execution(self, informaticist_user):
        SchemaService.ensure_standard_datasets()
        SyncService.sync_all_datasets()

        # Discovery manifest
        manifest = NocoDBMCPGateway.get_tool_manifest()
        assert len(manifest) >= 4

        # Query dataset via MCP
        res = NocoDBMCPGateway.execute_tool(
            tool_name="nocodb_query_dataset",
            arguments={"dataset_id": "ml_predictions_monitoring", "limit": 5},
            user=informaticist_user,
        )
        assert res["success"] is True
        assert len(res["result"]["rows"]) > 0

        # Drift metrics via MCP
        drift_res = NocoDBMCPGateway.execute_tool(
            tool_name="nocodb_get_drift_metrics",
            arguments={},
            user=informaticist_user,
        )
        assert drift_res["success"] is True
        assert len(drift_res["result"]["drift_records"]) > 0
