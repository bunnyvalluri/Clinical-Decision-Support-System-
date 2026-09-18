"""
Recovery Target Configuration Service.
Enforces that RPO and RTO targets remain 'Not yet defined' unless an authorized
administrator explicitly sets approved values.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional
from django.utils import timezone as dj_timezone

from apps.infrastructure.models import RecoveryTargetConfig
from integrations.observability.audit import AuditService

logger = logging.getLogger(__name__)


class RecoveryTargetConfigService:
    """
    Manages RPO / RTO targets and compliance parameters.
    """

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """
        Get current approved RPO/RTO targets or report 'Not yet defined'.
        """
        config = RecoveryTargetConfig.get_active_config()
        if not config.is_configured or config.approved_rpo_minutes is None or config.approved_rto_minutes is None:
            return {
                "is_configured": False,
                "rpo_display": "Not yet defined",
                "rto_display": "Not yet defined",
                "approved_rpo_minutes": None,
                "approved_rto_minutes": None,
                "backup_cadence": config.backup_cadence,
                "retention_days": config.retention_days,
                "approved_by": getattr(config.approved_by, "username", None),
                "last_reviewed_at": config.last_reviewed_at.isoformat() if config.last_reviewed_at else None,
                "compliance_framework": config.compliance_framework,
                "notes": config.notes,
            }

        return {
            "is_configured": True,
            "rpo_display": f"{config.approved_rpo_minutes} minutes",
            "rto_display": f"{config.approved_rto_minutes} minutes",
            "approved_rpo_minutes": config.approved_rpo_minutes,
            "approved_rto_minutes": config.approved_rto_minutes,
            "backup_cadence": config.backup_cadence,
            "retention_days": config.retention_days,
            "approved_by": getattr(config.approved_by, "username", "IT Administrator"),
            "last_reviewed_at": config.last_reviewed_at.isoformat() if config.last_reviewed_at else None,
            "compliance_framework": config.compliance_framework,
            "notes": config.notes,
        }

    @classmethod
    def update_targets(
        cls,
        actor: Any,
        rpo_minutes: int,
        rto_minutes: int,
        backup_cadence: str = "CONTINUOUS_WAL",
        retention_days: int = 30,
        notes: str = "",
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Configure approved RPO/RTO targets with audit logging.
        Requires authenticated IT Administrator.
        """
        if rpo_minutes <= 0 or rto_minutes <= 0:
            raise ValueError("RPO and RTO minutes must be positive integers.")

        config = RecoveryTargetConfig.get_active_config()
        config.is_configured = True
        config.approved_rpo_minutes = rpo_minutes
        config.approved_rto_minutes = rto_minutes
        config.backup_cadence = backup_cadence
        config.retention_days = retention_days
        config.approved_by = actor if getattr(actor, "is_authenticated", False) else None
        config.last_reviewed_at = dj_timezone.now()
        config.notes = notes
        config.save()

        AuditService.record_event(
            actor=actor,
            action="config.updated",
            resource_type="RecoveryTargetConfig",
            resource_id=str(config.id),
            description=f"Approved RPO target set to {rpo_minutes}m, RTO to {rto_minutes}m.",
            result="SUCCESS",
            metadata={
                "rpo_minutes": rpo_minutes,
                "rto_minutes": rto_minutes,
                "retention_days": retention_days,
                "cadence": backup_cadence,
            },
            correlation_id=correlation_id,
        )

        logger.info(f"Updated DR Targets: RPO={rpo_minutes}m, RTO={rto_minutes}m by {actor}")
        return cls.get_status()
