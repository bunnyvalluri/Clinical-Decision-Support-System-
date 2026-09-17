"""
Event Adapter for Cline Agent Realtime Streaming.
Emits safe execution summaries over Django Channels and persists immutable events to Neon PostgreSQL.
"""
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger("integrations.cline.events")


class ClineEventAdapter:
    """
    Coordinates WebSocket event broadcasting and audit persistence.
    """

    @classmethod
    def emit_event(
        cls,
        session_id: str,
        event_type: str,
        summary: str,
        correlation_id: str,
        task_id: Optional[str] = None,
        tool_name: str = "",
        resource_type: str = "",
        resource_id: str = "",
        approval_state: str = "NOT_REQUIRED",
    ) -> None:
        """
        Persists a ClineAgentEvent and broadcasts to Channels group.
        """
        from apps.ai_orchestrator.models import ClineAgentEvent, ClineAgentSession, ClineAgentTask

        # 1. Neon PostgreSQL Persistence
        try:
            session = ClineAgentSession.objects.get(id=session_id)
            task = ClineAgentTask.objects.filter(id=task_id).first() if task_id else None

            ClineAgentEvent.objects.create(
                session=session,
                task=task,
                event_type=event_type,
                tool_name=tool_name,
                resource_type=resource_type,
                resource_id=resource_id,
                summary=summary,
                approval_state=approval_state,
                correlation_id=correlation_id,
            )
        except Exception as exc:
            logger.error("Failed to persist ClineAgentEvent: %s", exc)

        # 2. Django Channels Broadcast (Safe summary only, zero raw CoT)
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                group_name = f"cline_session_{session_id}"
                payload = {
                    "type": "ai_event",
                    "data": {
                        "event": "CLINE_EVENT",
                        "session_id": str(session_id),
                        "task_id": str(task_id) if task_id else None,
                        "event_type": event_type,
                        "tool_name": tool_name,
                        "summary": summary,
                        "approval_state": approval_state,
                        "correlation_id": correlation_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                }
                async_to_sync(channel_layer.group_send)(group_name, payload)
                # Also emit to global ai_orchestration group for admin console
                async_to_sync(channel_layer.group_send)("ai_orchestration", payload)
        except Exception as err:
            logger.warning("Could not broadcast Cline realtime event: %s", err)
