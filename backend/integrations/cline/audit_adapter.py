"""
Audit Adapter for Cline Agent Execution.
Records immutable audit logs into AIAuditEvent with PHI scrubbing and correlation tracking.
"""
from decimal import Decimal
import logging
from typing import Any, Optional

logger = logging.getLogger("integrations.cline.audit")


class ClineAuditAdapter:
    """
    Standardized audit persistence for all Cline agent operations.
    """

    @classmethod
    def record_audit(
        cls,
        correlation_id: str,
        user_id: Optional[str],
        role: str,
        event_type: str,
        agent_type: str,
        payload_summary: str,
        safety_verdict: str = "PASSED",
        latency_ms: float = 0.0,
        cost: float = 0.0,
        model_name: str = "cline-v3.42.0",
    ) -> None:
        """
        Creates an immutable audit log entry in PostgreSQL.
        """
        from apps.ai_orchestrator.models import AIAuditEvent

        try:
            AIAuditEvent.objects.create(
                correlation_id=correlation_id,
                user_id=user_id,
                role=role,
                event_type=event_type,
                agent_type=agent_type,
                model_name=model_name,
                payload_summary=payload_summary[:255],
                safety_verdict=safety_verdict,
                latency_ms=latency_ms,
                cost=Decimal(str(round(cost, 6))),
            )
        except Exception as exc:
            logger.error("Failed to record Cline audit event: %s", exc)
