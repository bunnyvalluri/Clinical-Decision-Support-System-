"""
Security Orchestrator.
Coordinates the end-to-end security lifecycle: target allowlist validation,
scanner execution, 7-question gate evaluation, real-time Channels broadcast, and audit logging.
"""
import logging
from typing import Optional
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.security_testing.models import (
    SecurityTarget,
    SecurityScan,
    SecurityScanState,
    SecurityAuditEvent,
)
from apps.security_testing.services.adapter import AgenticBugHunterAdapter

logger = logging.getLogger("security_testing.orchestrator")


class SecurityOrchestrator:
    """
    High-level orchestrator for controlled DevSecOps operations.
    """

    @classmethod
    def emit_realtime_event(cls, event_type: str, data: dict):
        """Broadcasts real-time security events over Django Channels to authorized dashboard clients."""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "security_alerts",
                    {
                        "type": "security_message",
                        "event": event_type,
                        "payload": data,
                    },
                )
        except Exception as e:
            logger.debug(f"Channels real-time broadcast skipped or failed: {e}")

    @classmethod
    def start_scan(cls, scan_id: str, actor=None) -> SecurityScan:
        scan = SecurityScan.objects.get(id=scan_id)
        target: SecurityTarget = scan.target

        # 1. Target Allowlist & Default-Deny Check
        if not target.is_approval_valid:
            scan.status = SecurityScanState.BLOCKED
            scan.error_message = "Scan blocked: Target is not approved or approval has expired."
            scan.save(update_fields=["status", "error_message"])

            SecurityAuditEvent.objects.create(
                event_type="SCAN_BLOCKED_UNAUTHORIZED",
                actor=actor,
                target_name=target.name,
                details={"reason": scan.error_message, "environment": target.environment},
            )
            cls.emit_realtime_event("SECURITY_ALERT", {"scan_id": str(scan.id), "status": "BLOCKED", "target": target.name})
            return scan

        # 2. Audit start
        SecurityAuditEvent.objects.create(
            event_type="SCAN_STARTED",
            actor=actor,
            target_name=target.name,
            details={"scan_id": str(scan.id), "scan_type": scan.scan_type},
        )
        cls.emit_realtime_event("SCAN_STARTED", {"scan_id": str(scan.id), "target": target.name})

        # 3. Execute through Adapter
        adapter = AgenticBugHunterAdapter()
        adapter.initialize(scan)
        findings = adapter.scan(scan)

        # 4. Audit completion
        SecurityAuditEvent.objects.create(
            event_type="SCAN_COMPLETED",
            actor=actor,
            target_name=target.name,
            details={"scan_id": str(scan.id), "findings_count": len(findings)},
        )
        cls.emit_realtime_event("SCAN_COMPLETED", {
            "scan_id": str(scan.id),
            "target": target.name,
            "status": scan.status,
            "findings_count": len(findings),
        })

        return scan

    @classmethod
    def trigger_emergency_stop(cls, scan_id: str, actor=None, reason: str = "Emergency abort requested"):
        """Emergency kill-switch to immediately abort a running scan."""
        try:
            scan = SecurityScan.objects.get(id=scan_id)
            scan.status = SecurityScanState.CANCELLED
            scan.error_message = f"EMERGENCY_STOP: {reason}"
            scan.completed_at = timezone.now()
            scan.save(update_fields=["status", "error_message", "completed_at"])

            SecurityAuditEvent.objects.create(
                event_type="EMERGENCY_STOP",
                actor=actor,
                target_name=scan.target.name,
                details={"scan_id": str(scan.id), "reason": reason},
            )
            cls.emit_realtime_event("SECURITY_ALERT", {
                "scan_id": str(scan.id),
                "type": "EMERGENCY_STOP",
                "reason": reason,
            })
            return True
        except Exception as e:
            logger.error(f"Failed to trigger emergency stop for scan {scan_id}: {e}")
            return False
