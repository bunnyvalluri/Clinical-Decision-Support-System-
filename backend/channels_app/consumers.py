"""
Django Channels WebSocket consumers with strict RBAC authorization and heartbeat ping/pong.

Consumer → channel group naming convention:
  dashboard       → "dashboard"
  risk_alerts     → "risk_alerts"
  patient updates → "patient_{patient_id}"
  notifications   → "notifications_{user_id}"

Close codes:
  4001: Unauthenticated (missing, expired, or invalid JWT)
  4003: Unauthorized / Forbidden (role cannot join this group)
  4004: Resource Not Found (e.g. invalid patient UUID)
"""
import json
import logging
from typing import Any
import uuid

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from channels_app.events import HeartbeatPongEvent

logger = logging.getLogger(__name__)


class BaseConsumer(AsyncWebsocketConsumer):
    """
    Base consumer with authentication, authorization hooks, heartbeat ping/pong,
    and structured JSON dispatch.
    """

    group_name: str = ""

    async def get_group_name(self) -> str:
        """Return the channel group name for this connection."""
        return self.group_name

    async def check_authorization(self, user: Any) -> bool:
        """
        Authorization hook. Subclasses override to enforce role-based access.
        Returns True if authorized, False otherwise.
        """
        return True

    async def connect(self) -> None:
        """Authenticate, authorize, and join channel group."""
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            logger.warning("Unauthenticated WS connection attempt — closing with 4001.")
            await self.close(code=4001)
            return

        authorized = await self.check_authorization(user)
        if not authorized:
            logger.warning(
                "Unauthorized WS subscription attempt for user %s (role: %s) — closing with 4003.",
                getattr(user, "id", "unknown"),
                getattr(user, "role", "unknown"),
            )
            await self.close(code=4003)
            return

        self.group_name = await self.get_group_name()
        if not self.group_name:
            await self.close(code=4004)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info("WS connected: group=%s user=%s role=%s", self.group_name, user.id, getattr(user, "role", "unknown"))

    async def disconnect(self, close_code: int) -> None:
        """Leave the channel group on disconnect."""
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info("WS disconnected: group=%s code=%s", self.group_name, close_code)

    async def receive(self, text_data: str | None = None, bytes_data: bytes | None = None) -> None:
        """
        Handle incoming WebSocket messages from the client.
        Supports heartbeat ping/pong to detect stale connections.
        """
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except Exception:
            logger.debug("Received non-JSON text message: %s", text_data)
            return

        action = data.get("action") or data.get("type")
        if action == "ping":
            pong = HeartbeatPongEvent().to_dict()
            await self.send_json_message(pong)

    async def send_json_message(self, event: dict[str, Any]) -> None:
        """Send a JSON-serialised message to the connected client."""
        await self.send(text_data=json.dumps(event))

    async def task_status_updated(self, event: dict[str, Any]) -> None:
        """Handle background task lifecycle updates (QUEUED, PROCESSING, COMPLETED, FAILED)."""
        payload = event.get("payload", event)
        await self.send_json_message(
            {
                "event": "TASK_STATUS_UPDATED",
                "type": "task_status_updated",
                "task_id": payload.get("task_id"),
                "task_name": payload.get("task_name"),
                "status": payload.get("status"),
                "progress": payload.get("progress", 0),
                "result": payload.get("result"),
                "error": payload.get("error"),
                "timestamp": payload.get("timestamp", ""),
            }
        )


class DashboardConsumer(BaseConsumer):
    """
    ws://host/ws/dashboard/

    Broadcasts real-time prediction created events, dashboard statistics,
    and aggregate telemetry to authorized clinicians and staff.
    Patients are rejected with 4003 Forbidden.
    """

    group_name = "dashboard"

    async def check_authorization(self, user: Any) -> bool:
        """Only clinical staff, analysts, and admins can view dashboard stream."""
        if getattr(user, "is_superuser", False) or getattr(user, "is_admin", False):
            return True
        if getattr(user, "is_clinician", False) or getattr(user, "is_clinical_staff", False):
            return True
        if getattr(user, "is_analyst", False) or getattr(user, "is_staff", False):
            return True
        return False

    async def dashboard_update(self, event: dict[str, Any]) -> None:
        """Forward dashboard_update to client."""
        payload = event.get("payload", event)
        await self.send_json_message(
            {
                "event": "DASHBOARD_UPDATE",
                "type": "dashboard_update",
                "payload": payload,
            }
        )

    async def dashboard_stats_updated(self, event: dict[str, Any]) -> None:
        """Forward real-time aggregated stats to client."""
        payload = event.get("payload", event)
        stats = payload.get("stats") if "stats" in payload else payload
        await self.send_json_message(
            {
                "event": "DASHBOARD_STATS_UPDATED",
                "type": "dashboard_stats_updated",
                "stats": stats,
                "timestamp": payload.get("timestamp", ""),
            }
        )

    async def prediction_created(self, event: dict[str, Any]) -> None:
        """
        Forward privacy-safe prediction created event to dashboard clients.
        Notice: excludes patient PII/MRN.
        """
        payload = event.get("payload", event)
        await self.send_json_message(
            {
                "event": "PREDICTION_CREATED",
                "type": "prediction_created",
                "prediction_id": payload.get("prediction_id"),
                "patient_id": payload.get("patient_id"),
                "risk_level": payload.get("risk_level") or payload.get("prediction_result"),
                "probability": payload.get("probability"),
                "model_name": payload.get("model_name"),
                "model_version": payload.get("model_version"),
                "timestamp": payload.get("timestamp"),
            }
        )


class RiskAlertConsumer(BaseConsumer):
    """
    ws://host/ws/alerts/

    Broadcasts high and critical clinical risk alerts to attending clinicians.
    Patients and non-clinical roles are rejected with 4003 Forbidden.
    """

    group_name = "risk_alerts"

    async def check_authorization(self, user: Any) -> bool:
        """Only clinicians, clinical staff, and admins can receive risk alerts."""
        if getattr(user, "is_superuser", False) or getattr(user, "is_admin", False):
            return True
        if getattr(user, "is_clinician", False) or getattr(user, "is_clinical_staff", False):
            return True
        return False

    async def risk_alert(self, event: dict[str, Any]) -> None:
        """Forward risk alert payload to clinician client."""
        payload = event.get("payload", event)
        await self.send_json_message(
            {
                "event": "RISK_ALERT",
                "type": "risk_alert",
                "prediction_id": payload.get("prediction_id"),
                "patient_id": payload.get("patient_id"),
                "patient_mrn": payload.get("patient_mrn", ""),
                "risk_level": payload.get("risk_level") or payload.get("prediction_result"),
                "probability": payload.get("probability"),
                "severity": payload.get("severity", "HIGH"),
                "message": payload.get("message", "High risk alert"),
                "timestamp": payload.get("timestamp"),
            }
        )


@database_sync_to_async
def _check_patient_group_access(user: Any, patient_id_str: str) -> bool:
    """Validate whether user has permission to subscribe to a patient's stream."""
    if getattr(user, "is_superuser", False) or getattr(user, "is_admin", False):
        return True
    if getattr(user, "is_clinician", False) or getattr(user, "is_clinical_staff", False):
        return True

    if getattr(user, "is_patient", False):
        from apps.patients.models import Patient
        try:
            p_uuid = uuid.UUID(patient_id_str)
            patient = Patient.objects.get(id=p_uuid)
            return patient.user_id == user.id
        except Exception:
            return False

    return False


class PatientConsumer(BaseConsumer):
    """
    ws://host/ws/patients/<patient_id>/

    Sends per-patient updates to authorized clients.
    Patients can ONLY view their own records; cross-patient subscriptions are rejected with 4003.
    """

    async def check_authorization(self, user: Any) -> bool:
        patient_id: str = self.scope["url_route"]["kwargs"].get("patient_id", "")
        if not patient_id:
            return False
        return await _check_patient_group_access(user, patient_id)

    async def get_group_name(self) -> str:
        patient_id: str = self.scope["url_route"]["kwargs"]["patient_id"]
        return f"patient_{patient_id}"

    async def patient_update(self, event: dict[str, Any]) -> None:
        """Forward patient-specific update to subscribed clients."""
        payload = event.get("payload", event)
        await self.send_json_message(
            {
                "event": "PATIENT_UPDATE",
                "type": "patient_update",
                "payload": payload,
            }
        )

    async def prediction_created(self, event: dict[str, Any]) -> None:
        """Forward prediction created event to subscribed patient or doctor."""
        payload = event.get("payload", event)
        await self.send_json_message(
            {
                "event": "PREDICTION_CREATED",
                "type": "prediction_created",
                "payload": payload,
            }
        )


class NotificationConsumer(BaseConsumer):
    """
    ws://host/ws/notifications/

    Delivers in-app notifications to a specific authenticated user.
    Each user subscribes strictly to their own private channel group `notifications_{user.id}`.
    """

    async def get_group_name(self) -> str:
        user = self.scope["user"]
        return f"notifications_{user.id}"

    async def notification(self, event: dict[str, Any]) -> None:
        """Forward user-specific notification to client."""
        payload = event.get("payload", event)
        await self.send_json_message(
            {
                "event": "NOTIFICATION",
                "type": "notification",
                "notification_id": payload.get("notification_id"),
                "title": payload.get("title"),
                "severity": payload.get("severity"),
                "message": payload.get("message"),
                "action_url": payload.get("action_url", ""),
                "timestamp": payload.get("timestamp", ""),
            }
        )
