"""
Unified Observability Provider Facade for HealthNova AI.
Single entrypoint coordinating metrics, health checks, alerts, incidents, tracing, and audit events.
"""

from typing import Any, Dict, List, Optional

from integrations.deployment.health import HealthCheckService
from .alerts import Alert, AlertService
from .audit import AuditService
from .correlation import CorrelationContext
from .incidents import Incident, IncidentService, IncidentState, IncidentSeverity
from .metrics import MetricsService
from .redaction import SensitiveDataRedactor
from .tracing import TracingService


class ObservabilityProvider:
    """
    Central facade for all telemetry and reliability subsystems.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.metrics = MetricsService()
            cls._instance.health = HealthCheckService()
            cls._instance.alerts = AlertService()
            cls._instance.incidents = IncidentService()
            cls._instance.tracing = TracingService()
            cls._instance.audit = AuditService()
            cls._instance.redactor = SensitiveDataRedactor()
        return cls._instance

    def get_system_health(self) -> Dict[str, Any]:
        """Fetch true multi-tier health probe summary."""
        return self.health.perform_full_system_check()

    def get_system_metrics(self) -> Dict[str, Any]:
        """Fetch true metrics snapshot."""
        return self.metrics.get_metrics_snapshot()

    def get_evaluated_alerts(self) -> List[Alert]:
        """Evaluate real health and metrics against operational rules."""
        h = self.get_system_health()
        m = self.get_system_metrics()
        return self.alerts.evaluate_rules(h, m)

    def get_dashboard_summary(self, user_role: str = "IT_ADMIN") -> Dict[str, Any]:
        """
        Aggregate real system status, alerts, and metrics filtered by user role.
        """
        health = self.get_system_health()
        metrics = self.get_system_metrics()
        active_alerts = self.alerts.get_alerts_for_role(user_role)
        incidents = self.incidents.list_incidents() if user_role in ("ADMIN", "IT_ADMIN", "SRE") else []

        return {
            "status": health.get("status", "UNKNOWN"),
            "timestamp": health.get("timestamp"),
            "health": health.get("services", {}),
            "metrics": metrics,
            "alerts": active_alerts,
            "incidents": incidents,
        }
