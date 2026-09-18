"""
Incident Management Lifecycle Service for HealthNova AI CDSS.
Tracks real incidents through deterministic states:
DETECTED -> ACKNOWLEDGED -> INVESTIGATING -> MITIGATING -> RESOLVED -> POSTMORTEM.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import enum
import logging
import uuid
from typing import Any, Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class IncidentSeverity(str, enum.Enum):
    SEV1_CRITICAL = "SEV1_CRITICAL"
    SEV2_HIGH = "SEV2_HIGH"
    SEV3_MEDIUM = "SEV3_MEDIUM"
    SEV4_LOW = "SEV4_LOW"


class IncidentState(str, enum.Enum):
    DETECTED = "DETECTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    INVESTIGATING = "INVESTIGATING"
    MITIGATING = "MITIGATING"
    RESOLVED = "RESOLVED"
    POSTMORTEM = "POSTMORTEM"


@dataclass
class IncidentTimelineEntry:
    timestamp: str
    actor: str
    message: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None


@dataclass
class Incident:
    id: str
    title: str
    severity: IncidentSeverity
    service: str
    environment: str
    state: IncidentState = IncidentState.DETECTED
    owner: str = "Unassigned"
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    resolved_at: Optional[str] = None
    correlation_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    resolution_summary: Optional[str] = None
    timeline: List[Dict[str, Any]] = field(default_factory=list)


class IncidentService:
    """
    Manages operational incidents with full auditability and state transitions.
    """

    _incidents: Dict[str, Incident] = {}

    def __init__(self):
        self.environment = getattr(settings, "ENVIRONMENT", "production")

    def create_incident(
        self,
        title: str,
        severity: IncidentSeverity,
        service: str,
        actor: str,
        correlation_id: Optional[str] = None,
        initial_notes: str = "Incident detected automatically or reported by operator.",
    ) -> Incident:
        """Create new tracked incident."""
        inc_id = f"INC-{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:6].upper()}"
        inc = Incident(
            id=inc_id,
            title=title,
            severity=severity,
            service=service,
            environment=self.environment,
            correlation_id=correlation_id or str(uuid.uuid4()),
            timeline=[{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "actor": actor,
                "message": initial_notes,
                "previous_state": None,
                "new_state": IncidentState.DETECTED.value,
            }],
        )
        self._incidents[inc_id] = inc
        logger.warning(f"Created Incident [{inc_id}] {title} (Severity: {severity.value}) by {actor}")
        return inc

    def transition_state(
        self,
        incident_id: str,
        new_state: IncidentState,
        actor: str,
        note: str = "",
        resolution_summary: Optional[str] = None,
    ) -> Incident:
        """Advance incident through lifecycle state machine."""
        inc = self._incidents.get(incident_id)
        if not inc:
            raise KeyError(f"Incident {incident_id} not found.")

        prev_state = inc.state
        inc.state = new_state

        if new_state == IncidentState.RESOLVED:
            inc.resolved_at = datetime.now(timezone.utc).isoformat()
            if resolution_summary:
                inc.resolution_summary = resolution_summary

        inc.timeline.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor": actor,
            "message": note or f"Transitioned state from {prev_state.value} to {new_state.value}",
            "previous_state": prev_state.value,
            "new_state": new_state.value,
        })

        logger.info(f"Incident [{incident_id}] state updated to {new_state.value} by {actor}")
        return inc

    def list_incidents(
        self,
        state_filter: Optional[str] = None,
        severity_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List active and historical incidents."""
        results = []
        for inc in self._incidents.values():
            if state_filter and inc.state.value != state_filter:
                continue
            if severity_filter and inc.severity.value != severity_filter:
                continue
            results.append({
                "id": inc.id,
                "title": inc.title,
                "severity": inc.severity.value,
                "service": inc.service,
                "environment": inc.environment,
                "state": inc.state.value,
                "owner": inc.owner,
                "started_at": inc.started_at,
                "resolved_at": inc.resolved_at,
                "correlation_id": inc.correlation_id,
                "resolution_summary": inc.resolution_summary,
                "timeline_count": len(inc.timeline),
            })
        return sorted(results, key=lambda x: x["started_at"], reverse=True)

    def get_incident_detail(self, incident_id: str) -> Optional[Dict[str, Any]]:
        inc = self._incidents.get(incident_id)
        if not inc:
            return None
        return {
            "id": inc.id,
            "title": inc.title,
            "severity": inc.severity.value,
            "service": inc.service,
            "environment": inc.environment,
            "state": inc.state.value,
            "owner": inc.owner,
            "started_at": inc.started_at,
            "resolved_at": inc.resolved_at,
            "correlation_id": inc.correlation_id,
            "resolution_summary": inc.resolution_summary,
            "timeline": inc.timeline,
        }
