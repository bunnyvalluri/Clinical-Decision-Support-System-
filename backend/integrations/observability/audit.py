from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from django.utils import timezone

from .correlation import CorrelationContext
from .redaction import SensitiveDataRedactor

logger = logging.getLogger(__name__)


class AuditService:
    """
    Creates immutable audit records for regulatory compliance and forensics.
    """

    @staticmethod
    def record_event(
        actor: Any,
        action: str,
        resource_type: str,
        resource_id: str,
        description: str,
        result: str = "SUCCESS",
        metadata: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> AuditLog:
        """
        Record compliance audit entry with redacted metadata and correlation tracking.
        """
        user_obj = actor if getattr(actor, "is_authenticated", False) else None
        corr_id = correlation_id or CorrelationContext.get_correlation_id()

        clean_meta = SensitiveDataRedactor.redact_dict(metadata or {})
        clean_meta["result"] = result
        clean_meta["correlation_id"] = corr_id

        from apps.core.models import AuditLog
        log_entry = AuditLog.objects.create(
            user=user_obj,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            description=SensitiveDataRedactor.redact_text(description),
            metadata=clean_meta,
        )

        logger.info(
            f"Audit [{action}] on {resource_type}:{resource_id} by {getattr(user_obj, 'email', 'System')} [result={result}, corr={corr_id}]"
        )
        return log_entry
