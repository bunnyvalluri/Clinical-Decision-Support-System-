"""
Engineering Loop Realtime WebSocket Consumer (Prompt 45).
Streams events:
- loop.created / loop.updated / loop.scheduled
- loop.run.started / loop.run.progress / loop.run.verifying / loop.run.completed / loop.run.failed
- loop.budget.warning / loop.budget.exceeded / loop.policy.denied
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("channels_app.loop_consumers")


class EngineeringLoopConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint for /ws/engineering/loops/
    Only IT Administrators or authorized Medical Informaticists permitted.
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        role = getattr(user, "role", "")
        if not (user.is_superuser or role in ["IT_ADMIN", "ADMIN", "MEDICAL_INFORMATICIST"]):
            logger.warning(f"Forbidden engineering WS connection attempt by user {user} (role: {role})")
            await self.close(code=4003)
            return

        self.group_name = "engineering_loops"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(
            text_data=json.dumps({
                "type": "connection_established",
                "message": "Connected to Engineering Loop Automation Stream",
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

    async def loop_event(self, event):
        await self.send(
            text_data=json.dumps({
                "event": event.get("event"),
                "data": event.get("data"),
                "timestamp": event.get("timestamp"),
            })
        )
