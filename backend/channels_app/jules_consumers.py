"""
Google Jules Realtime WebSocket Consumer.
Streams events:
- jules.session.created / jules.session.planning / jules.plan.approval_required
- jules.activity.created / jules.progress.updated
- jules.validation.started / jules.validation.completed
- jules.remediation.completed / jules.remediation.failed
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("channels_app.jules_consumers")


class JulesAutomationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint for /ws/automation/jules/
    Accessible strictly to IT_ADMIN, ADMIN, or superuser.
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        role = getattr(user, "role", "")
        if not (user.is_superuser or role in ["IT_ADMIN", "ADMIN"]):
            logger.warning("Forbidden Jules WS connection attempt by user %s (role: %s)", user, role)
            await self.close(code=4003)
            return

        self.group_name = "jules_automation"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(
            text_data=json.dumps({
                "type": "connection_established",
                "message": "Connected to Google Jules Automation Stream",
            })
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            payload = json.loads(text_data or "{}")
            if payload.get("action") == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
        except Exception:
            pass

    async def jules_event(self, event):
        """Dispatches an event from Celery or Django signal to the connected client."""
        await self.send(
            text_data=json.dumps({
                "event": event.get("event"),
                "data": event.get("data"),
            })
        )
