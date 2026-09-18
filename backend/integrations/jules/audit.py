"""
Cryptographic and structured audit logging for Google Jules engineering automation.
Writes immutable audit trails to Neon PostgreSQL and logs structured records.
"""
import logging
from typing import Dict, Any, Optional
from django.utils import timezone
from integrations.jules.models import JulesAuditEvent

logger = logging.getLogger("jules.audit")


class JulesAuditLogger:
    @classmethod
    def record(
        cls,
        action: str,
        resource_type: str,
        resource_id: str,
        actor_id: str = "SYSTEM",
        correlation_id: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> JulesAuditEvent:
        """
        Creates an immutable JulesAuditEvent record in Neon PostgreSQL.
        """
        meta = metadata or {}
        event = JulesAuditEvent.objects.create(
            actor_id=str(actor_id),
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            correlation_id=correlation_id,
            metadata=meta,
        )

        logger.info(
            "JULES_AUDIT: action=%s resource=%s:%s actor=%s correlation_id=%s",
            action,
            resource_type,
            resource_id,
            actor_id,
            correlation_id,
            extra={
                "audit_action": action,
                "resource_type": resource_type,
                "resource_id": str(resource_id),
                "actor_id": str(actor_id),
                "correlation_id": correlation_id,
                "metadata": meta,
            },
        )
        return event
