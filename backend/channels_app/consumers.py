"""
Django Channels WebSocket consumers.

Each consumer handles a specific real-time channel. Consumers are kept thin:
they receive WS events and dispatch them to the appropriate service/group.
Business logic lives in the service layer, not in consumers.

Consumer → channel group naming convention:
  dashboard       → "dashboard"
  risk_alerts     → "risk_alerts"
  patient updates → "patient_{patient_id}"
  notifications   → "notifications_{user_id}"
"""
import json
import logging
from typing import Any

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class BaseConsumer(AsyncWebsocketConsumer):
    """
    Base consumer with common connect/disconnect/error handling.

    Subclasses set ``group_name`` or compute it dynamically in
    ``get_group_name()``.
    """

    group_name: str = ""

    async def get_group_name(self) -> str:
        """Return the channel group name for this connection."""
        return self.group_name

    async def connect(self) -> None:
        """Authenticate and join the channel group."""
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            logger.warning("Unauthenticated WS connection attempt — closing.")
            await self.close(code=4001)
            return

        self.group_name = await self.get_group_name()
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info("WS connected: group=%s user=%s", self.group_name, user.id)

    async def disconnect(self, close_code: int) -> None:
        """Leave the channel group on disconnect."""
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info("WS disconnected: group=%s code=%s", self.group_name, close_code)

    async def receive(self, text_data: str | None = None, bytes_data: bytes | None = None) -> None:
        """Handle inbound WS messages (most consumers are receive-only from server)."""
        pass

    async def send_json_message(self, event: dict[str, Any]) -> None:
        """Send a JSON-serialised message to the connected client."""
        await self.send(text_data=json.dumps(event))


class DashboardConsumer(BaseConsumer):
    """
    ws://host/ws/dashboard/

    Broadcasts real-time dashboard metric updates to all connected clinicians.
    Updates are pushed by Celery tasks after predictions complete.
    """

    group_name = "dashboard"

    async def dashboard_update(self, event: dict[str, Any]) -> None:
        """Receive a dashboard.update group message and forward to client."""
        await self.send_json_message(
            {
                "type": "dashboard_update",
                "payload": event.get("payload", {}),
            }
        )


class RiskAlertConsumer(BaseConsumer):
    """
    ws://host/ws/alerts/

    Broadcasts critical risk alerts to all connected clinical staff.
    Alerts are pushed when a prediction result crosses the CRITICAL threshold.
    """

    group_name = "risk_alerts"

    async def risk_alert(self, event: dict[str, Any]) -> None:
        """Receive a risk_alert group message and forward to client."""
        await self.send_json_message(
            {
                "type": "risk_alert",
                "payload": event.get("payload", {}),
            }
        )


class PatientConsumer(BaseConsumer):
    """
    ws://host/ws/patients/<patient_id>/

    Sends per-patient updates (new vitals recorded, prediction completed, etc.)
    to any client subscribed to that patient's channel.
    """

    async def get_group_name(self) -> str:
        patient_id: str = self.scope["url_route"]["kwargs"]["patient_id"]
        return f"patient_{patient_id}"

    async def patient_update(self, event: dict[str, Any]) -> None:
        """Forward patient-specific update to subscribed clients."""
        await self.send_json_message(
            {
                "type": "patient_update",
                "payload": event.get("payload", {}),
            }
        )


class NotificationConsumer(BaseConsumer):
    """
    ws://host/ws/notifications/

    Delivers in-app notifications to a specific authenticated user.
    Each user subscribes to their own private channel group.
    """

    async def get_group_name(self) -> str:
        user = self.scope["user"]
        return f"notifications_{user.id}"

    async def notification(self, event: dict[str, Any]) -> None:
        """Forward user-specific notification to client."""
        await self.send_json_message(
            {
                "type": "notification",
                "payload": event.get("payload", {}),
            }
        )
