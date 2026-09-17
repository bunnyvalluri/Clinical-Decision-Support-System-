import logging
import time
from typing import Any, Dict, Optional
from apps.ai_agents.models import AgentExecution
from apps.core.models import AuditLog

logger = logging.getLogger("ai_agents.services.audit_service")


class AuditService:
    """
    Central Audit Engine for Clinical AI Agents.
    Synchronizes with authoritative Neon PostgreSQL audit tables.
    """
    @classmethod
    def record_agent_audit(
        cls,
        action: str,
        user,
        execution: AgentExecution,
        correlation_id: str,
        patient_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status: str = "SUCCESS",
    ) -> None:
        try:
            # Mask sensitive values in details
            safe_details = {}
            if details:
                for k, v in details.items():
                    if any(secret_term in str(k).lower() for secret_term in ["token", "password", "secret", "auth"]):
                        safe_details[k] = "[REDACTED]"
                    else:
                        safe_details[k] = v

            AuditLog.objects.create(
                user=user,
                action=AuditLog.Action.PREDICT if "predict" in action.lower() else AuditLog.Action.READ,
                resource_type="AIAgentExecution",
                resource_id=str(execution.id),
                description=f"AI Agent execution {action.upper()}",
                metadata={
                    "action_name": f"AI_AGENT_{action.upper()}",
                    "correlation_id": correlation_id,
                    "session_id": str(execution.session_id),
                    "patient_id": str(patient_id) if patient_id else None,
                    "status": status,
                    "details": safe_details,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
            )
        except Exception as exc:
            logger.error(f"Failed to record audit log: {exc}")
