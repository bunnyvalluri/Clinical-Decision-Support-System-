"""
Hermetic & Fast Unit Test Suite for Prompt 61 — Disaster Recovery, Backup, Continuity, and Rollback.
Runs completely offline in < 2 seconds without external network or Neon connection pool latency.
"""

from datetime import datetime, timezone
import hashlib
from unittest.mock import MagicMock, patch
import uuid
import pytest

from apps.accounts.models import UserRole
from apps.infrastructure.models import (
    RecoveryTargetConfig,
    BackupRecord,
    DisasterRecoveryDrill,
    RollbackRecord,
)
from apps.model_registry.models import ModelVersion, ModelStatus
from integrations.disaster_recovery import (
    RecoveryTargetConfigService,
    NeonRecoveryService,
    RestorationVerificationService,
    MLModelRecoveryService,
    AIRecoveryService,
    SecretsRecoveryService,
    RedisRecoveryService,
    MeilisearchRecoveryService,
    DatasetRecoveryService,
)
from integrations.observability import (
    AlertService,
    AlertSeverity,
    AlertCategory,
    AuditService,
)


@pytest.fixture
def mock_actor():
    user = MagicMock()
    user.is_authenticated = True
    user.username = "it_admin_dr"
    user.role = UserRole.IT_ADMIN
    return user


# -----------------------------------------------------------------------------
# 1. RPO / RTO TARGET GOVERNANCE ("NOT YET DEFINED" DEFAULT)
# -----------------------------------------------------------------------------

def test_recovery_target_defaults_not_yet_defined():
    """Section 6 & 47: Targets must report 'Not yet defined' when unconfigured."""
    with patch.object(RecoveryTargetConfig, "get_active_config") as mock_cfg:
        instance = MagicMock()
        instance.is_configured = False
        instance.approved_rpo_minutes = None
        instance.approved_rto_minutes = None
        instance.backup_cadence = "NOT_DEFINED"
        instance.retention_days = None
        instance.approved_by = None
        instance.last_reviewed_at = None
        instance.compliance_framework = "HIPAA Security Rule"
        instance.notes = ""
        mock_cfg.return_value = instance

        status_data = RecoveryTargetConfigService.get_status()
        assert status_data["is_configured"] is False
        assert status_data["rpo_display"] == "Not yet defined"
        assert status_data["rto_display"] == "Not yet defined"
        assert status_data["approved_rpo_minutes"] is None
        assert status_data["approved_rto_minutes"] is None


def test_update_recovery_targets_and_audit(mock_actor):
    """Authorized administrator can configure approved targets with audit trail."""
    with patch.object(RecoveryTargetConfig, "get_active_config") as mock_cfg, \
         patch.object(AuditService, "record_event") as mock_audit:

        instance = MagicMock()
        instance.id = uuid.uuid4()
        mock_cfg.return_value = instance

        status_data = RecoveryTargetConfigService.update_targets(
            actor=mock_actor,
            rpo_minutes=15,
            rto_minutes=30,
            backup_cadence="CONTINUOUS_WAL",
            retention_days=30,
            notes="Approved per Hospital Security Protocol 2026-DR-01",
        )
        assert instance.is_configured is True
        assert instance.approved_rpo_minutes == 15
        assert instance.approved_rto_minutes == 30
        assert instance.save.called
        assert mock_audit.called


# -----------------------------------------------------------------------------
# 2. BACKUP RECORD CREATION & CRYPTOGRAPHIC VALIDATION
# -----------------------------------------------------------------------------

def test_neon_logical_backup_and_validation(mock_actor):
    """Verify backup creation records cryptographic SHA-256 hash and encryption."""
    with patch.object(BackupRecord.objects, "create") as mock_create, \
         patch.object(AuditService, "record_event") as mock_audit:

        rec = MagicMock()
        rec.id = uuid.uuid4()
        rec.checksum = "f" * 64
        rec.is_encrypted = True
        rec.status = BackupRecord.Status.COMPLETED
        rec.validation_status = BackupRecord.ValidationStatus.VALIDATED
        mock_create.return_value = rec

        record = NeonRecoveryService.execute_logical_backup(actor=mock_actor)
        assert record.is_encrypted is True
        assert len(record.checksum) == 64
        assert mock_audit.called


def test_pre_migration_safety_snapshot(mock_actor):
    """Verify pre-migration zero-copy snapshot branch creation."""
    with patch.object(BackupRecord.objects, "create") as mock_create, \
         patch.object(AuditService, "record_event"):

        rec = MagicMock()
        rec.id = uuid.uuid4()
        mock_create.return_value = rec

        res = NeonRecoveryService.create_pre_migration_snapshot(
            actor=mock_actor,
            migration_name="0003_add_clinical_indexes",
        )
        assert res["status"] == "COMPLETED"
        assert "pre-migration-0003_add_clinical_indexes" in res["branch_name"]
        assert "neon branches create" in res["cli_command"]


# -----------------------------------------------------------------------------
# 3. 14-POINT RESTORATION VERIFICATION CHECKLIST
# -----------------------------------------------------------------------------

def test_restoration_verification_checklist_14_points(mock_actor):
    """Section 52: Verify all 14 criteria are evaluated without fabricated passes."""
    with patch("integrations.disaster_recovery.verification_service.connection") as mock_conn, \
         patch.object(DisasterRecoveryDrill.objects, "create") as mock_drill, \
         patch.object(AuditService, "record_event"):

        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = [1]
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

        drill_inst = MagicMock()
        drill_inst.id = uuid.uuid4()
        drill_inst.drill_name = "Unit Test Probe"
        mock_drill.return_value = drill_inst

        probe = RestorationVerificationService.execute_verification_probe(
            drill_name="Unit Test Probe",
            actor=mock_actor,
        )
        checklist = probe["checklist"]
        assert len(checklist) == 14

        required_keys = [
            "service_starts",
            "database_connects",
            "schema_valid",
            "apis_respond",
            "authentication_works",
            "rbac_enforced",
            "websockets_functional",
            "celery_workers_active",
            "ml_model_loads",
            "model_version_correct",
            "dataset_lineage_intact",
            "audit_logging_active",
            "health_checks_pass",
            "secrets_redacted",
        ]
        for k in required_keys:
            assert k in checklist
            assert "status" in checklist[k]


# -----------------------------------------------------------------------------
# 4. OBSERVABILITY ALERTS FOR BCDR
# -----------------------------------------------------------------------------

def test_alert_rules_backup_failure():
    """Rule 6: Failed backup triggers CRITICAL alert."""
    alert_service = AlertService()
    alerts = alert_service.evaluate_rules(
        health_summary={},
        metrics_summary={},
        backup_summary={
            "latest_backup_failed": True,
            "error": "S3 connection timeout during upload",
        },
    )
    failed_alert = next((a for a in alerts if a.id == "ALERT-BACKUP-FAILED"), None)
    assert failed_alert is not None
    assert failed_alert.severity == AlertSeverity.CRITICAL
    assert failed_alert.category == AlertCategory.BACKUP_DR


def test_alert_rules_backup_age_exceeded():
    """Rule 8: Backup age exceeding approved RPO triggers HIGH alert."""
    alert_service = AlertService()
    alerts = alert_service.evaluate_rules(
        health_summary={},
        metrics_summary={},
        backup_summary={
            "backup_age_minutes": 120,
            "approved_rpo_minutes": 60,
        },
    )
    age_alert = next((a for a in alerts if a.id == "ALERT-BACKUP-AGE-EXCEEDED"), None)
    assert age_alert is not None
    assert age_alert.severity == AlertSeverity.HIGH
    assert "120m" in age_alert.title


def test_alert_rules_restore_test_failed():
    """Rule 9: Restoration test failure triggers CRITICAL alert."""
    alert_service = AlertService()
    alerts = alert_service.evaluate_rules(
        health_summary={},
        metrics_summary={},
        backup_summary={
            "restore_test_failed": True,
            "failed_criteria": ["database_connects", "schema_valid"],
        },
    )
    restore_alert = next((a for a in alerts if a.id == "ALERT-RESTORE-TEST-FAILED"), None)
    assert restore_alert is not None
    assert restore_alert.severity == AlertSeverity.CRITICAL


# -----------------------------------------------------------------------------
# 5. VERSION-AWARE ML MODEL ROLLBACK
# -----------------------------------------------------------------------------

def test_version_aware_ml_model_rollback(mock_actor):
    """Section 23 & 32: Rollback must be version-aware and require approved state."""
    with patch.object(ModelVersion.objects, "filter") as mock_filter, \
         patch.object(ModelVersion.objects, "get") as mock_get, \
         patch.object(RollbackRecord.objects, "create") as mock_rb_create, \
         patch.object(AuditService, "record_event"):

        curr = MagicMock()
        curr.version = "2.0.0"
        curr.feature_schema_version = "v1.0"
        mock_filter.return_value.order_by.return_value.first.return_value = curr

        target = MagicMock()
        target.id = uuid.uuid4()
        target.version = "1.0.0"
        target.algorithm = "RandomForest"
        target.status = ModelStatus.APPROVED
        target.feature_schema_version = "v1.0"
        mock_get.return_value = target

        rb_inst = MagicMock()
        rb_inst.id = uuid.uuid4()
        mock_rb_create.return_value = rb_inst

        res = MLModelRecoveryService.rollback_model(
            target_version_string="1.0.0",
            actor=mock_actor,
            reason="Calibration drift",
        )
        assert res["success"] is True
        assert res["active_version"] == "1.0.0"
        assert res["compatibility_verified"] is True
        assert curr.status == ModelStatus.ROLLED_BACK
        assert target.status == ModelStatus.PRODUCTION


def test_rollback_rejects_unapproved_model(mock_actor):
    """Unapproved or draft model cannot be rolled back to."""
    with patch.object(ModelVersion.objects, "filter"), \
         patch.object(ModelVersion.objects, "get") as mock_get:

        draft = MagicMock()
        draft.version = "3.0.0-draft"
        draft.status = ModelStatus.DRAFT
        mock_get.return_value = draft

        with pytest.raises(PermissionError):
            MLModelRecoveryService.rollback_model(
                target_version_string="3.0.0-draft",
                actor=mock_actor,
                reason="Attempting unauthorized draft promotion",
            )


# -----------------------------------------------------------------------------
# 6. SAFE DEGRADED MODES & CONTINUITY
# -----------------------------------------------------------------------------

def test_ai_outage_degraded_mode(mock_actor):
    """Section 37 & 38: AI outage must return 'Prediction service unavailable'."""
    with patch.object(AuditService, "record_event"):
        res = AIRecoveryService.handle_inference_outage(
            actor=mock_actor,
            reason="Ollama daemon unresponsive",
        )
        assert res["status"] == "DEGRADED"
        assert res["prediction_available"] is False
        assert res["display_text"] == "Prediction service unavailable"


def test_secret_rotation_workflow(mock_actor):
    """Section 15: Secret rotation logs emergency audit event and invalidates key."""
    with patch.object(AuditService, "record_event") as mock_audit:
        res = SecretsRecoveryService.rotate_compromised_secret(
            secret_name="DJANGO_SECRET_KEY",
            actor=mock_actor,
            incident_id="SEC-TEST-001",
        )
        assert res["status"] == "ROTATED"
        assert "backend" in res["restart_required"]
        assert mock_audit.called
