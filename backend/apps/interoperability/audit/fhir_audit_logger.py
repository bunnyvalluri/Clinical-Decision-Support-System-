"""
FHIR Audit Logger — BPY-CSE-2666.
Maintains complete auditability across all inbound and outbound clinical interoperability events.
"""
from typing import Any, Dict, Optional
from django.utils import timezone

from apps.core.models import AuditLog
from apps.interoperability.models import FHIREndpoint, FHIRAuditLog


class FHIRAuditLogger:
    """
    Records immutable audit entries for all interoperability transactions.
    """

    @classmethod
    def log_transaction(
        cls,
        direction: str,
        operation: str,
        status_code: int,
        is_success: bool,
        resource_type: str = "",
        endpoint: Optional[FHIREndpoint] = None,
        user: Any = None,
        ip_address: Optional[str] = None,
        user_agent: str = "",
        duration_ms: float = 0.0,
        details: Optional[Dict[str, Any]] = None,
        correlation_id: str = "",
    ) -> FHIRAuditLog:
        """Record an interoperability transaction in both the dedicated FHIR audit log and system audit log."""
        # 1. Dedicated FHIR Audit Log (IntegrationAuditEvent)
        from apps.interoperability.models import IntegrationAuditEvent, IntegrationConnection

        action = IntegrationAuditEvent.Action.IMPORT_COMPLETED if is_success else IntegrationAuditEvent.Action.IMPORT_FAILED
        if "EXPORT" in operation or direction == "OUTBOUND":
            action = IntegrationAuditEvent.Action.EXPORT_COMPLETED if is_success else IntegrationAuditEvent.Action.EXPORT_REJECTED
        elif "RESOLVE_CONFLICT" in operation:
            action = IntegrationAuditEvent.Action.RECONCILIATION_DECISION

        event_details = dict(details or {})
        event_details.update({
            "direction": direction,
            "operation": operation,
            "status_code": status_code,
            "is_success": is_success,
            "resource_type": resource_type,
            "user_agent": user_agent[:512] if user_agent else "",
            "duration_ms": float(duration_ms),
        })

        fhir_log = IntegrationAuditEvent.objects.create(
            connection=endpoint if isinstance(endpoint, IntegrationConnection) else None,
            actor=user if getattr(user, "is_authenticated", False) else None,
            actor_username=getattr(user, "username", "") if user else "",
            action=action,
            resource=resource_type or "FHIR",
            source="HealthNova_FHIR_Hub",
            result="SUCCESS" if is_success else "FAILURE",
            correlation_id=correlation_id,
            details=event_details,
            ip_address=ip_address,
        )

        # 2. System-wide Core AuditLog for enterprise compliance
        try:
            action_code = AuditLog.Action.EXPORT if direction == "OUTBOUND" else AuditLog.Action.CREATE
            AuditLog.objects.create(
                user=user if getattr(user, "is_authenticated", False) else None,
                action=action_code,
                resource_type=f"FHIR_{resource_type or 'Bundle'}",
                resource_id=correlation_id or str(fhir_log.id),
                description=f"FHIR {direction} {operation} [{status_code}] (Success: {is_success})",
                ip_address=ip_address,
                user_agent=user_agent[:512] if user_agent else "",
                metadata={
                    "direction": direction,
                    "operation": operation,
                    "endpoint": endpoint.name if endpoint else None,
                    "duration_ms": duration_ms,
                },
            )
        except Exception:
            pass  # Non-blocking for core audit

        return fhir_log
