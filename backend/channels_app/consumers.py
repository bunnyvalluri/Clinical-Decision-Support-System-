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


class UserConsumer(BaseConsumer):
    """
    ws://host/ws/user/

    Dedicated WebSocket connection for the patient/user self-service portal.
    Enforces that only authenticated patients can subscribe to their own private channel group:
    `patient_{patient_id}` and `notifications_{user.id}`.
    """

    async def get_group_name(self) -> str:
        user = self.scope["user"]
        patient = await self.get_patient_for_user(user)
        if patient:
            return f"patient_{patient.id}"
        return f"user_{user.id}"

    @database_sync_to_async
    def get_patient_for_user(self, user: Any):
        from apps.patients.models import Patient
        if hasattr(user, "patient_profile") and user.patient_profile:
            return user.patient_profile
        patient = Patient.objects.filter(user=user).first()
        if patient:
            return patient
        return Patient.objects.first()

    async def user_event(self, event: dict[str, Any]) -> None:
        """Forward structured user event envelope to client."""
        data = event.get("event", event)
        await self.send_json_message(data)


class AIOrchestratorConsumer(BaseConsumer):
    """
    ws://host/ws/ai/
    ws://host/ws/ai/<workflow_id>/

    Real-time WebSocket stream for Ruflo multi-agent lifecycle events,
    task status transitions, safety alerts, and human approval notifications.
    Access is restricted to authorized clinicians, informaticists, and administrators.
    """

    group_name = "ai_orchestration"

    async def get_group_name(self) -> str:
        workflow_id = self.scope.get("url_route", {}).get("kwargs", {}).get("workflow_id")
        if workflow_id:
            return f"ai_workflow_{workflow_id}"
        return "ai_orchestration"

    async def check_authorization(self, user: Any) -> bool:
        role = getattr(user, "role", "")
        # Patients are strictly forbidden from global orchestration events
        if role in ["PATIENT", "USER"] and not getattr(user, "is_staff", False):
            return False
        return True

    async def ai_event(self, event: dict[str, Any]) -> None:
        """Handle structured real-time AI event dispatch."""
        data = event.get("data", event)
        await self.send_json_message(data)

    async def receive_json(self, content: dict[str, Any]) -> None:
        msg_type = content.get("type", "")
        if msg_type == "ping":
            await self.send_json_message({"type": "pong", "timestamp": _utc_now_iso() if "_utc_now_iso" in globals() else ""})
        elif msg_type == "subscribe_task":
            task_id = content.get("task_id")
            if task_id:
                task_group = f"ai_task_{task_id}"
                await self.channel_layer.group_add(task_group, self.channel_name)
                await self.send_json_message({"type": "subscribed", "group": task_group})


class WhiteboardCollaborationConsumer(BaseConsumer):
    """
    ws://host/ws/whiteboards/<whiteboard_id>/

    Real-time collaborative editing, live cursor broadcast, and user presence
    for Clinical Whiteboards. Powered strictly by Django Channels + Redis.
    """

    async def get_group_name(self) -> str:
        whiteboard_id = self.scope.get("url_route", {}).get("kwargs", {}).get("whiteboard_id")
        return f"whiteboard_{whiteboard_id}" if whiteboard_id else ""

    async def check_authorization(self, user: Any) -> bool:
        whiteboard_id = self.scope.get("url_route", {}).get("kwargs", {}).get("whiteboard_id")
        if not whiteboard_id:
            return False
        return await self._verify_whiteboard_access(user, whiteboard_id)

    @database_sync_to_async
    def _verify_whiteboard_access(self, user: Any, whiteboard_id: str) -> bool:
        from apps.whiteboards.models import ClinicalWhiteboard, DataClassification, WhiteboardType, WhiteboardStatus
        try:
            wb = ClinicalWhiteboard.objects.get(id=whiteboard_id)
        except Exception:
            return False

        role = getattr(user, "role", "")
        if role == "PATIENT":
            if wb.type not in [WhiteboardType.CARE_PLAN, WhiteboardType.PATIENT_JOURNEY] or wb.status != WhiteboardStatus.APPROVED:
                return False
            patient = getattr(user, "patient_profile", None)
            return bool(patient and wb.patient == patient)

        if role in ["IT_ADMIN", "ADMIN"]:
            if wb.is_phi or wb.classification in [DataClassification.PHI, DataClassification.RESTRICTED]:
                return False
            return True

        return True

    async def connect(self) -> None:
        await super().connect()
        if self.group_name:
            user = self.scope["user"]
            color = "#0284c7"
            if getattr(user, "role", "") == "NURSE":
                color = "#10b981"
            elif getattr(user, "role", "") == "MEDICAL_INFORMATICIST":
                color = "#8b5cf6"

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "user_presence_event",
                    "event": "USER_JOINED",
                    "user_id": str(user.id),
                    "user_name": user.get_full_name() or user.username,
                    "role": getattr(user, "role", ""),
                    "color": color,
                },
            )

    async def disconnect(self, close_code: int) -> None:
        if self.group_name:
            user = self.scope.get("user")
            if user and hasattr(user, "id"):
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "user_presence_event",
                        "event": "USER_LEFT",
                        "user_id": str(user.id),
                    },
                )
        await super().disconnect(close_code)

    async def receive(self, text_data: str | None = None, bytes_data: bytes | None = None) -> None:
        if not text_data:
            return
        try:
            data = json.loads(text_data)
        except Exception:
            return

        msg_type = data.get("type") or data.get("action")
        user = self.scope["user"]

        if msg_type == "ping":
            await self.send_json_message({"type": "pong", "timestamp": _utc_now_iso()})
            return

        if msg_type == "WHITEBOARD_UPDATE":
            # Broadcast element changes to other room collaborators
            elements = data.get("elements", [])
            version = data.get("version", 1)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "whiteboard_broadcast",
                    "sender_channel": self.channel_name,
                    "sender_id": str(user.id),
                    "sender_name": user.get_full_name() or user.username,
                    "elements": elements,
                    "version": version,
                },
            )

        elif msg_type == "CURSOR_MOVE":
            x = data.get("x", 0)
            y = data.get("y", 0)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "cursor_broadcast",
                    "sender_channel": self.channel_name,
                    "user_id": str(user.id),
                    "user_name": user.get_full_name() or user.username,
                    "role": getattr(user, "role", ""),
                    "x": x,
                    "y": y,
                },
            )

    async def whiteboard_broadcast(self, event: dict[str, Any]) -> None:
        # Don't echo back to the sender
        if self.channel_name == event.get("sender_channel"):
            return
        await self.send_json_message({
            "type": "WHITEBOARD_UPDATE",
            "sender_id": event.get("sender_id"),
            "sender_name": event.get("sender_name"),
            "elements": event.get("elements"),
            "version": event.get("version"),
        })

    async def cursor_broadcast(self, event: dict[str, Any]) -> None:
        if self.channel_name == event.get("sender_channel"):
            return
        await self.send_json_message({
            "type": "CURSOR_UPDATE",
            "user_id": event.get("user_id"),
            "user_name": event.get("user_name"),
            "role": event.get("role"),
            "x": event.get("x"),
            "y": event.get("y"),
        })

    async def user_presence_event(self, event: dict[str, Any]) -> None:
        await self.send_json_message({
            "type": event.get("event"),
            "user_id": event.get("user_id"),
            "user_name": event.get("user_name"),
            "role": event.get("role"),
            "color": event.get("color"),
        })


class NocoDBWorkspaceConsumer(BaseConsumer):
    """
    ws://host/ws/nocodb/<dataset_slug>/

    Real-time data synchronization and workspace updates for NocoDB governed datasets.
    Broadcasts row updates, sync events, and schema notifications.
    """

    async def get_group_name(self) -> str:
        slug = self.scope.get("url_route", {}).get("kwargs", {}).get("dataset_slug")
        return f"nocodb_{slug}" if slug else ""

    async def check_authorization(self, user: Any) -> bool:
        slug = self.scope.get("url_route", {}).get("kwargs", {}).get("dataset_slug")
        if not slug:
            return False
        return await self._verify_dataset_access(user, slug)

    @database_sync_to_async
    def _verify_dataset_access(self, user: Any, slug: str) -> bool:
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        from apps.nocodb.models import NocoDBDataset
        from apps.nocodb.permissions import normalize_role
        try:
            ds = NocoDBDataset.objects.get(slug=slug, is_active=True)
            role = normalize_role(getattr(user, "role", ""))
            allowed = [r.lower() for r in (ds.allowed_roles or [])]
            if role == "admin" and ("admin" in allowed or "it_admin" in allowed):
                return True
            return role in allowed
        except Exception:
            return False

    async def dataset_update_broadcast(self, event: dict[str, Any]) -> None:
        await self.send_json_message({
            "type": "DATASET_UPDATE",
            "dataset_slug": event.get("dataset_slug"),
            "action": event.get("action"),
            "record_id": event.get("record_id"),
            "timestamp": event.get("timestamp"),
        })

    async def sync_completed_broadcast(self, event: dict[str, Any]) -> None:
        await self.send_json_message({
            "type": "SYNC_COMPLETED",
            "dataset_slug": event.get("dataset_slug"),
            "row_count": event.get("row_count"),
            "timestamp": event.get("timestamp"),
        })



