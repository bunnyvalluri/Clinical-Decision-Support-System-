"""
Production Alerting Engine & Rule Evaluator for HealthNova AI.
Evaluates metrics against deterministic operational thresholds with role-based routing
and deduplication to prevent alert fatigue.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import enum
import logging
from typing import Any, Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    INFO = "INFO"


class AlertCategory(str, enum.Enum):
    INFRASTRUCTURE = "INFRASTRUCTURE"
    DATABASE = "DATABASE"
    APPLICATION = "APPLICATION"
    ML = "ML"
    AI = "AI"
    SECURITY = "SECURITY"
    BACKUP_DR = "BACKUP_DR"


@dataclass
class Alert:
    id: str
    title: str
    description: str
    severity: AlertSeverity
    category: AlertCategory
    service: str
    environment: str
    target_role: str
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "ACTIVE"
    runbook_url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class AlertService:
    """
    Evaluates system telemetry against deterministic SLO/SLA rules.
    Dispatches notifications and routes alerts to the appropriate operational domain.
    """

    def __init__(self):
        self.active_alerts: Dict[str, Alert] = {}
        self.environment = getattr(settings, "ENVIRONMENT", "production")

    def evaluate_rules(
        self,
        health_summary: Dict[str, Any],
        metrics_summary: Dict[str, Any],
        backup_summary: Optional[Dict[str, Any]] = None,
    ) -> List[Alert]:
        """
        Evaluate real metrics, health probes, and backup states against operational rules.
        """
        evaluated: List[Alert] = []
        services = health_summary.get("services", {})

        # Rule 1: Neon Database Outage (CRITICAL -> SRE / DevOps)
        db_health = services.get("database", {})
        if db_health.get("status") == "UNHEALTHY":
            alert_id = "ALERT-DB-UNAVAILABLE"
            alert = Alert(
                id=alert_id,
                title="Neon PostgreSQL Database Unavailable",
                description=f"Primary database health probe failed: {db_health.get('error', 'Connection refused')}",
                severity=AlertSeverity.CRITICAL,
                category=AlertCategory.DATABASE,
                service="neon-postgres",
                environment=self.environment,
                target_role="DEVOPS_SRE",
                runbook_url="/docs/observability/runbooks.md#database-unavailable",
                metadata={"latency_ms": db_health.get("latency_ms")},
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-DB-UNAVAILABLE", None)

        # Rule 2: Redis Broker Outage (CRITICAL -> SRE / DevOps)
        redis_health = services.get("redis", {})
        if redis_health.get("status") == "UNHEALTHY":
            alert_id = "ALERT-REDIS-UNAVAILABLE"
            alert = Alert(
                id=alert_id,
                title="Redis Message Broker & Cache Offline",
                description=f"Redis health probe failed: {redis_health.get('error', 'Connection refused')}",
                severity=AlertSeverity.CRITICAL,
                category=AlertCategory.INFRASTRUCTURE,
                service="redis",
                environment=self.environment,
                target_role="DEVOPS_SRE",
                runbook_url="/docs/observability/runbooks.md#redis-unavailable",
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-REDIS-UNAVAILABLE", None)

        # Rule 3: Elevated API Error Rate (HIGH -> Engineering)
        http_metrics = metrics_summary.get("http", {})
        error_rate = http_metrics.get("error_rate_pct", 0.0)
        total_reqs = http_metrics.get("total_requests", 0)

        if total_reqs >= 50 and error_rate > 10.0:
            alert_id = "ALERT-API-HIGH-ERROR-RATE"
            alert = Alert(
                id=alert_id,
                title=f"Elevated API Error Rate ({error_rate}%)",
                description=f"HTTP 4xx/5xx error rate exceeded threshold (10.0%) across {total_reqs} requests.",
                severity=AlertSeverity.HIGH,
                category=AlertCategory.APPLICATION,
                service="django-asgi",
                environment=self.environment,
                target_role="ENGINEERING",
                runbook_url="/docs/observability/runbooks.md#high-api-error-rate",
                metadata={"error_rate_pct": error_rate, "total_requests": total_reqs},
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-API-HIGH-ERROR-RATE", None)

        # Rule 4: High API p95 Latency (MEDIUM -> Engineering)
        p95_latency = http_metrics.get("p95_latency_ms", 0.0)
        if total_reqs >= 30 and p95_latency > 1500.0:
            alert_id = "ALERT-API-HIGH-LATENCY"
            alert = Alert(
                id=alert_id,
                title=f"High API p95 Latency ({p95_latency}ms)",
                description=f"HTTP p95 latency exceeded 1500ms threshold.",
                severity=AlertSeverity.MEDIUM,
                category=AlertCategory.APPLICATION,
                service="django-asgi",
                environment=self.environment,
                target_role="ENGINEERING",
                runbook_url="/docs/observability/runbooks.md#high-api-latency",
                metadata={"p95_latency_ms": p95_latency},
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-API-HIGH-LATENCY", None)

        # Rule 5: Celery Failures (MEDIUM -> Engineering / MLOps)
        celery_metrics = metrics_summary.get("celery", {})
        tasks_failed = celery_metrics.get("tasks_failed", 0)
        if tasks_failed > 5:
            alert_id = "ALERT-CELERY-FAILURES"
            alert = Alert(
                id=alert_id,
                title=f"Celery Task Failures Detected ({tasks_failed})",
                description=f"Multiple asynchronous background tasks failed during processing.",
                severity=AlertSeverity.MEDIUM,
                category=AlertCategory.APPLICATION,
                service="celery-worker",
                environment=self.environment,
                target_role="ENGINEERING",
                runbook_url="/docs/observability/runbooks.md#celery-queue-backlog",
                metadata={"failed_count": tasks_failed},
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-CELERY-FAILURES", None)

        # Rule 6: Backup Failure (CRITICAL -> SRE / DevOps)
        backup_data = backup_summary or {}
        if backup_data.get("latest_backup_failed"):
            alert_id = "ALERT-BACKUP-FAILED"
            alert = Alert(
                id=alert_id,
                title="Clinical Data Backup Execution Failed",
                description=f"Automated backup job terminated with error: {backup_data.get('error', 'Unknown failure')}",
                severity=AlertSeverity.CRITICAL,
                category=AlertCategory.BACKUP_DR,
                service="backup-orchestrator",
                environment=self.environment,
                target_role="DEVOPS_SRE",
                runbook_url="/docs/disaster-recovery/runbooks/database-recovery.md",
                metadata=backup_data,
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-BACKUP-FAILED", None)

        # Rule 7: Backup Validation / Checksum Failure (HIGH -> SRE / DevOps)
        if backup_data.get("validation_failed"):
            alert_id = "ALERT-BACKUP-VALIDATION-FAILED"
            alert = Alert(
                id=alert_id,
                title="Backup Checksum / Integrity Validation Mismatch",
                description="Backup archive failed SHA-256 integrity verification or header read probe.",
                severity=AlertSeverity.HIGH,
                category=AlertCategory.BACKUP_DR,
                service="backup-orchestrator",
                environment=self.environment,
                target_role="DEVOPS_SRE",
                runbook_url="/docs/disaster-recovery/runbooks/database-recovery.md",
                metadata=backup_data,
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-BACKUP-VALIDATION-FAILED", None)

        # Rule 8: Backup Age Exceeded Approved RPO (HIGH -> SRE / DevOps)
        backup_age_minutes = backup_data.get("backup_age_minutes")
        approved_rpo = backup_data.get("approved_rpo_minutes")
        if approved_rpo and backup_age_minutes and backup_age_minutes > approved_rpo:
            alert_id = "ALERT-BACKUP-AGE-EXCEEDED"
            alert = Alert(
                id=alert_id,
                title=f"Backup Age ({backup_age_minutes}m) Exceeds Approved RPO ({approved_rpo}m)",
                description="Elapsed time since last valid backup violates approved Recovery Point Objective.",
                severity=AlertSeverity.HIGH,
                category=AlertCategory.BACKUP_DR,
                service="backup-orchestrator",
                environment=self.environment,
                target_role="DEVOPS_SRE",
                runbook_url="/docs/disaster-recovery/runbooks/database-recovery.md",
                metadata={"backup_age_minutes": backup_age_minutes, "approved_rpo_minutes": approved_rpo},
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-BACKUP-AGE-EXCEEDED", None)

        # Rule 9: Restore Test / Drill Failure (CRITICAL -> SRE / DevOps)
        if backup_data.get("restore_test_failed"):
            alert_id = "ALERT-RESTORE-TEST-FAILED"
            alert = Alert(
                id=alert_id,
                title="Disaster Recovery 14-Point Restore Verification Failed",
                description=f"Isolated DR drill verification probe reported failures in critical subsystems: {backup_data.get('failed_criteria', [])}",
                severity=AlertSeverity.CRITICAL,
                category=AlertCategory.BACKUP_DR,
                service="disaster-recovery",
                environment=self.environment,
                target_role="DEVOPS_SRE",
                runbook_url="/docs/disaster-recovery/runbooks/complete-environment-recovery.md",
                metadata=backup_data,
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-RESTORE-TEST-FAILED", None)

        # Rule 10: Rollback Failure (HIGH -> SRE / DevOps)
        if backup_data.get("rollback_failed"):
            alert_id = "ALERT-ROLLBACK-FAILED"
            alert = Alert(
                id=alert_id,
                title="Deployment or ML Model Rollback Execution Failed",
                description=f"Automated rollback failed to revert to previous known-good version: {backup_data.get('error', '')}",
                severity=AlertSeverity.HIGH,
                category=AlertCategory.BACKUP_DR,
                service="deployment-orchestrator",
                environment=self.environment,
                target_role="DEVOPS_SRE",
                runbook_url="/docs/disaster-recovery/runbooks/docker-recovery.md",
                metadata=backup_data,
            )
            self.active_alerts[alert_id] = alert
            evaluated.append(alert)
        else:
            self.active_alerts.pop("ALERT-ROLLBACK-FAILED", None)

        return list(self.active_alerts.values())

    def get_alerts_for_role(self, role: str) -> List[Dict[str, Any]]:
        """Filter alerts based on user role authorization."""
        alerts = list(self.active_alerts.values())
        if role in ("ADMIN", "IT_ADMIN", "SRE"):
            # Full visibility
            return [vars(a) for a in alerts]
        elif role in ("MEDICAL_INFORMATICIST", "INFORMATICIST", "ANALYST"):
            # Informaticists see ML, AI, Database alerts
            allowed_cats = {AlertCategory.ML, AlertCategory.AI, AlertCategory.DATABASE, AlertCategory.APPLICATION}
            return [vars(a) for a in alerts if a.category in allowed_cats]
        elif role in ("DOCTOR", "NURSE"):
            # Clinical roles only see high/critical service availability
            return [
                {
                    "id": a.id,
                    "title": a.title,
                    "severity": a.severity.value,
                    "timestamp": a.timestamp,
                    "status": a.status,
                }
                for a in alerts if a.severity in (AlertSeverity.CRITICAL, AlertSeverity.HIGH)
            ]
        return []
