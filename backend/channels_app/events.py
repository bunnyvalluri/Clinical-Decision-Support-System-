"""
Standardized Real-Time Event Schemas for Django Channels and WebSockets.

Provides strongly-typed event definitions and factory builders ensuring
safe serialization across Redis channel layers and WebSocket clients.
"""
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import UUID


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class PredictionCreatedEvent:
    prediction_id: str
    patient_id: str
    risk_level: str
    probability: float
    model_name: str
    model_version: str
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": "PREDICTION_CREATED",
            "type": "prediction_created",
            "prediction_id": str(self.prediction_id),
            "patient_id": str(self.patient_id),
            "risk_level": self.risk_level,
            "probability": round(float(self.probability), 4),
            "model_name": self.model_name,
            "model_version": self.model_version,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class RiskAlertEvent:
    prediction_id: str
    patient_id: str
    patient_mrn: str
    risk_level: str
    probability: float
    severity: str  # "HIGH" | "CRITICAL"
    message: str
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": "RISK_ALERT",
            "type": "risk_alert",
            "prediction_id": str(self.prediction_id),
            "patient_id": str(self.patient_id),
            "patient_mrn": self.patient_mrn,
            "risk_level": self.risk_level,
            "probability": round(float(self.probability), 4),
            "severity": self.severity,
            "message": self.message,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class DashboardStatsUpdatedEvent:
    total_patients: int
    high_risk_cases: int
    critical_risk_cases: int
    predictions_today: int
    avg_latency_ms: float
    active_model: str
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": "DASHBOARD_STATS_UPDATED",
            "type": "dashboard_stats_updated",
            "stats": {
                "total_patients": self.total_patients,
                "high_risk_cases": self.high_risk_cases,
                "critical_risk_cases": self.critical_risk_cases,
                "predictions_today": self.predictions_today,
                "avg_latency_ms": round(float(self.avg_latency_ms), 2),
                "active_model": self.active_model,
            },
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class NotificationEvent:
    notification_id: str
    title: str
    severity: str
    message: str
    action_url: str = ""
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": "NOTIFICATION",
            "type": "notification",
            "notification_id": str(self.notification_id),
            "title": self.title,
            "severity": self.severity,
            "message": self.message,
            "action_url": self.action_url,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class HeartbeatPongEvent:
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": "PONG",
            "type": "pong",
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class TaskStatusEvent:
    task_id: str
    task_name: str
    status: str  # "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"
    progress: int = 0
    result: dict[str, Any] | None = None
    error: str | None = None
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": "TASK_STATUS_UPDATED",
            "type": "task_status_updated",
            "task_id": str(self.task_id),
            "task_name": self.task_name,
            "status": self.status.upper(),
            "progress": int(self.progress),
            "result": self.result,
            "error": self.error,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class ModelLifecycleEvent:
    model_name: str
    version: str
    status: str
    event_type: str  # "model.status.changed" | "model.activated" | "model.validation.failed"
    actor: str = ""
    reason: str = ""
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": self.event_type.upper().replace(".", "_"),
            "type": "model_lifecycle",
            "model_name": self.model_name,
            "version": self.version,
            "status": self.status,
            "event_type": self.event_type,
            "actor": self.actor,
            "reason": self.reason,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True)
class DriftAlertEvent:
    drift_type: str  # "FEATURE_DRIFT" | "PREDICTION_DRIFT"
    feature_or_class: str
    metric_name: str
    metric_value: float
    severity: str  # "MODERATE" | "SEVERE"
    message: str
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            object.__setattr__(self, "timestamp", _utc_now_iso())

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": "DRIFT_DETECTED",
            "type": "drift_detected",
            "drift_type": self.drift_type,
            "feature_or_class": self.feature_or_class,
            "metric_name": self.metric_name,
            "metric_value": round(float(self.metric_value), 4),
            "severity": self.severity,
            "message": self.message,
            "timestamp": self.timestamp,
        }

