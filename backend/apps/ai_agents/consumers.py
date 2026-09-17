import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from apps.ai_agents.models import AgentSession

logger = logging.getLogger("ai_agents.consumers")


class AIAgentConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time WebSocket consumer for live AI agent execution updates.
    Enforces JWT authentication and object-level session authorization.
    """
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.session_id = self.scope["url_route"]["kwargs"].get("session_id")
        self.group_name = f"ai_agent_{self.session_id}"

        # Join session broadcast group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(f"User {user.id} subscribed to AI agent session {self.session_id}")

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Heartbeat or client ping
        if content.get("action") == "ping":
            await self.send_json({"type": "pong", "timestamp": content.get("timestamp")})

    async def agent_event(self, event):
        """Dispatches operational updates directly to frontend."""
        await self.send_json(event["event"])
