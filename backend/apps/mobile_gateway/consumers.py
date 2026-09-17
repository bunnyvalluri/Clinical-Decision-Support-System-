"""
Django Channels WebSocket consumer for real-time mobile gateway updates.

Guarantees user isolation:
- Patients receive updates for their own devices only.
- IT Administrators receive operational event stream and kill switch notifications.
- Doctors and Nurses are rejected from personal device stream.
"""
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from apps.accounts.models import UserRole


class MobileGatewayConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        # Deny Clinicians surveillance privileges
        if user.role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.NURSE]:
            await self.close(code=4403)
            return

        self.groups_joined = []

        if user.role in [UserRole.IT_ADMIN, UserRole.ADMIN] or user.is_superuser:
            await self.channel_layer.group_add("mobile_admin_stream", self.channel_name)
            self.groups_joined.append("mobile_admin_stream")

        user_group = f"mobile_user_{user.id}"
        await self.channel_layer.group_add(user_group, self.channel_name)
        self.groups_joined.append(user_group)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "groups_joined"):
            for group in self.groups_joined:
                await self.channel_layer.group_discard(group, self.channel_name)

    async def mobile_event_update(self, event):
        """Sends sanitized mobile event telemetry to the authorized client."""
        await self.send_json(event.get("event", {}))
