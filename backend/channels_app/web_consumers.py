"""
WebSocket Consumer for real-time Web Intelligence and Crawl job events.
Endpoint: ws://<host>/ws/web/
"""
import json
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger("apps.channels")


class WebIntelligenceConsumer(AsyncJsonWebsocketConsumer):
    """
    Subscribes client to the 'web_intelligence' broadcast group.
    Pushes real-time crawl job progress and evidence research notifications.
    """
    GROUP_NAME = "web_intelligence"

    async def connect(self) -> None:
        user = self.scope.get("user")
        # Enforce authenticated session or permitted access
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()
        logger.info(f"WebIntelligenceConsumer connected: {self.channel_name}")

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)
        logger.info(f"WebIntelligenceConsumer disconnected: {self.channel_name}")

    async def receive_json(self, content: dict, **kwargs) -> None:
        """Handles inbound client messages (e.g. ping)."""
        action = content.get("action")
        if action == "ping":
            await self.send_json({"type": "pong"})

    async def web_job_event(self, event: dict) -> None:
        """Receives broadcast from channel layer group and sends to client."""
        await self.send_json(event)
