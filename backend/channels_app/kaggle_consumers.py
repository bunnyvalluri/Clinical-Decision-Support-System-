"""
Kaggle Dataset Intelligence WebSocket Consumer for Django Channels.
Streams real-time discovery, validation, and ML training telemetry to authorized Medical Informaticists.
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("channels_app.kaggle_consumers")

# Authorized roles for dataset management (Article V & Role Taxonomy)
AUTHORIZED_ROLES = {"MEDICAL_INFORMATICIST", "IT_ADMIN", "ANALYST"}


class KaggleDatasetConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint for /ws/datasets/ and /ws/datasets/<dataset_id>/
    Enforces that only authenticated Medical Informaticists or IT Admins can subscribe.
    """

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        role = getattr(user, "role", "")
        if not (user.is_superuser or role in AUTHORIZED_ROLES):
            logger.warning(
                "Forbidden dataset WS connection attempt by user %s (role: %s)",
                user,
                role,
            )
            await self.close(code=4003)
            return

        # Global channel group
        self.global_group = "kaggle_datasets"
        await self.channel_layer.group_add(self.global_group, self.channel_name)

        # Optional dataset-specific channel
        self.dataset_id = self.scope["url_route"]["kwargs"].get("dataset_id")
        if self.dataset_id:
            self.dataset_group = f"dataset_{self.dataset_id}"
            await self.channel_layer.group_add(self.dataset_group, self.channel_name)

        await self.accept()
        await self.send(
            text_data=json.dumps({
                "type": "connection_established",
                "message": "Connected to Kaggle Dataset Intelligence Stream",
                "dataset_id": self.dataset_id,
            })
        )

    async def disconnect(self, close_code):
        if hasattr(self, "global_group"):
            await self.channel_layer.group_discard(self.global_group, self.channel_name)
        if getattr(self, "dataset_id", None) and hasattr(self, "dataset_group"):
            await self.channel_layer.group_discard(self.dataset_group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            payload = json.loads(text_data or "{}")
            action = payload.get("action")
            if action == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
        except Exception:
            pass

    async def dataset_event(self, event):
        """Handler for events dispatched via group_send."""
        await self.send(text_data=json.dumps(event.get("payload", {})))
