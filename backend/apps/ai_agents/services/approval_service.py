import logging
from typing import Any, Dict, Optional
from django.utils import timezone
from apps.ai_agents.models import (
    AgentApproval,
    AgentExecution,
    AgentExecutionStatus,
    AgentSecurityLevel,
    AgentSession,
    AgentSessionStatus,
    ApprovalStatus,
)

logger = logging.getLogger("ai_agents.services.approval_service")


class ApprovalService:
    """
    Human-in-the-Loop Governance Service.
    Enforces server-side clinician approval before any high-risk clinical action is committed.
    """
    @classmethod
    def request_approval(
        cls,
        execution: AgentExecution,
        session: AgentSession,
        requested_action: str,
        reason: str,
        action_payload: Dict[str, Any],
        affected_patient=None,
        risk_level: str = AgentSecurityLevel.CRITICAL,
        evidence_summary: Optional[Dict[str, Any]] = None,
        approving_role: str = "doctor",
        ttl_minutes: int = 60,
    ) -> AgentApproval:
        expires_at = timezone.now() + timezone.timedelta(minutes=ttl_minutes)
        approval = AgentApproval.objects.create(
            execution=execution,
            session=session,
            requested_action=requested_action,
            reason=reason,
            action_payload=action_payload,
            affected_patient=affected_patient,
            risk_level=risk_level,
            evidence_summary=evidence_summary or {},
            approving_role=approving_role,
            status=ApprovalStatus.REQUESTED,
            expires_at=expires_at,
        )

        # Pause execution and session
        execution.status = AgentExecutionStatus.WAITING_APPROVAL
        execution.save(update_fields=["status"])

        session.status = AgentSessionStatus.WAITING_APPROVAL
        session.save(update_fields=["status"])

        logger.info(f"Created AgentApproval {approval.id} for action '{requested_action}'.")
        return approval

    @classmethod
    def process_decision(
        cls,
        approval: AgentApproval,
        clinician,
        decision: str,
        rationale: str = "",
    ) -> AgentApproval:
        """
        Records human clinician sign-off decision (APPROVED or REJECTED).
        """
        decision_upper = decision.upper().strip()
        if decision_upper not in [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]:
            raise ValueError(f"Invalid approval decision '{decision}'. Must be APPROVED or REJECTED.")

        approval.status = decision_upper
        approval.reviewed_by = clinician
        approval.reviewed_at = timezone.now()
        approval.clinician_rationale = rationale
        approval.save(update_fields=["status", "reviewed_by", "reviewed_at", "clinician_rationale"])

        # Resume session status
        session = approval.session
        session.status = AgentSessionStatus.COMPLETED if decision_upper == ApprovalStatus.APPROVED else AgentSessionStatus.FAILED
        session.save(update_fields=["status"])

        execution = approval.execution
        execution.status = AgentExecutionStatus.COMPLETED if decision_upper == ApprovalStatus.APPROVED else AgentExecutionStatus.CANCELLED
        execution.save(update_fields=["status"])

        return approval
