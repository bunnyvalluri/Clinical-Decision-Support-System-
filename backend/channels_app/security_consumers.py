"""
Security Agent WebSocket Consumer for Django Channels (Prompt 44).
Streams realtime telemetry, execution traces, and finding notifications for
security agent runs to authorized administrators.
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("channels_app.security_consumers")


class SecurityAgentConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint for /ws/security/agents/
    Enforces that only authenticated IT_ADMIN or superusers can subscribe.
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        # RBAC Check: Only IT_ADMIN or superuser permitted
        role = getattr(user, "role", "")
        if not (user.is_superuser or role == "IT_ADMIN"):
            logger.warning(f"Forbidden security WS connection attempt by user {user} (role: {role})")
            await self.close(code=4003)
            return

        self.group_name = "security_agents"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(
            text_data=json.dumps({
                "type": "connection_established",
                "message": "Connected to Security Agent Telemetry Stream",
            })
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming client messages (e.g. heartbeat or filter requests)."""
        try:
            payload = json.loads(text_data or "{}")
            action = payload.get("action")
            if action == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
        except Exception:
            pass

    async def security_agent_event(self, event):
        """Handler for events sent via channel_layer.group_send."""
        await self.send(
            text_data=json.dumps({
                "event": event.get("event"),
                "data": event.get("data"),
                "timestamp": event.get("timestamp"),
            })
        )
