"""
WebSocket consumer for Browser Agent Tasks and Execution Traces.

Endpoint: ws://host/ws/ai-agents/tasks/
Group: "browser_agent_tasks"
Authorized Roles: ADMIN, INFORMATICIST, CLINICIAN, DOCTOR
"""
import json
import logging
from typing import Any

from apps.accounts.models import UserRole
from channels_app.consumers import BaseConsumer

logger = logging.getLogger("channels_app.browser_agent_consumers")


class BrowserAgentTaskConsumer(BaseConsumer):
    """
    Real-time streaming consumer for browser agent task lifecycle and verification events.
    """

    group_name = "browser_agent_tasks"

    async def check_authorization(self, user: Any) -> bool:
        """
        Only staff, administrators, clinicians, and informaticists may stream browser automation.
        Patients and external users are strictly forbidden.
        """
        role = getattr(user, "role", "")
        authorized_roles = [
            UserRole.ADMIN,
            UserRole.INFORMATICIST,
            UserRole.CLINICIAN,
            UserRole.DOCTOR,
        ]
        return role in authorized_roles or getattr(user, "is_superuser", False)

    async def broadcast_agent_event(self, event: dict) -> None:
        """Handler for group messages sent via channel_layer."""
        await self.send(text_data=json.dumps(event.get("data", {})))

    async def receive(self, text_data: str = "", bytes_data: bytes = b"") -> None:
        """Handle client inbound messages (e.g. heartbeat ping)."""
        try:
            data = json.loads(text_data)
            if data.get("type") == "ping":
                await self.send(text_data=json.dumps({"type": "pong"}))
        except Exception:
            pass
