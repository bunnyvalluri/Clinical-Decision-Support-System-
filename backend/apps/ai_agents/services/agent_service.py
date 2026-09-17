import logging
from typing import Any, Dict, List, Optional
from django.utils import timezone
from apps.ai_agents.models import (
    AgentExecution,
    AgentExecutionStatus,
    AgentFeedback,
    AgentSession,
    AgentSessionStatus,
)
from apps.ai_agents.schemas.requests import AgentRunRequest
from apps.ai_agents.schemas.responses import AgentRunResponse
from apps.ai_agents.services.agent_executor import AgentExecutor
from apps.ai_agents.services.agent_factory import AgentFactory
from apps.patients.models import Patient

logger = logging.getLogger("ai_agents.services.agent_service")


class AgentService:
    """
    High-level facade for clinical AI agent operations.
    Handles session creation, multi-turn execution dispatch, cancellation, and feedback.
    """
    def __init__(self):
        self.executor = AgentExecutor()

    def get_or_create_session(
        self,
        user,
        patient_id: Optional[str] = None,
        agent_type: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AgentSession:
        role = getattr(user, "role", "doctor")
        definition = AgentFactory.get_or_create_for_role(role)

        patient_obj = None
        if patient_id:
            try:
                patient_obj = Patient.objects.filter(id=patient_id).first()
            except Exception:
                pass

        session = AgentSession.objects.create(
            agent_definition=definition,
            agent_type=agent_type or definition.slug,
            user=user,
            role=role,
            patient=patient_obj,
            provider=provider or "ollama",
            model=model or "medllama3:latest",
            status=AgentSessionStatus.CREATED,
        )
        return session

    def execute_turn(
        self,
        user,
        request_dto: AgentRunRequest,
        correlation_id: Optional[str] = None,
    ) -> AgentRunResponse:
        # Resolve or create session
        session = None
        if request_dto.session_id:
            session = AgentSession.objects.filter(id=request_dto.session_id, user=user).first()
        
        if not session:
            session = self.get_or_create_session(
                user=user,
                patient_id=request_dto.patient_id,
                agent_type=request_dto.agent_type,
                provider=request_dto.provider,
                model=request_dto.model,
            )

        return self.executor.run(
            session=session,
            user_query=request_dto.query,
            user=user,
            patient_id=request_dto.patient_id,
            correlation_id=correlation_id,
        )

    def cancel_execution(self, execution_id: str, user) -> bool:
        """
        Enforces server-side cancellation of an active execution.
        """
        execution = AgentExecution.objects.filter(id=execution_id).first()
        if not execution:
            return False

        # Verify ownership
        if execution.session.user_id != user.id and getattr(user, "role", "") != "admin":
            return False

        if execution.status in [AgentExecutionStatus.COMPLETED, AgentExecutionStatus.CANCELLED, AgentExecutionStatus.FAILED]:
            return True

        execution.status = AgentExecutionStatus.CANCELLED
        execution.completed_at = timezone.now()
        execution.error_code = "USER_CANCELLED"
        execution.error_message = "Execution cancelled by clinician."
        execution.save(update_fields=["status", "completed_at", "error_code", "error_message"])

        session = execution.session
        session.status = AgentSessionStatus.CANCELLED
        session.save(update_fields=["status"])

        # Broadcast cancellation event
        self.executor._broadcast_event(str(session.id), "agent.cancelled", {"execution_id": execution_id})
        return True

    def submit_feedback(self, execution_id: str, user, rating: str, comments: str = "") -> AgentFeedback:
        execution = AgentExecution.objects.get(id=execution_id)
        return AgentFeedback.objects.create(
            execution=execution,
            user=user,
            rating=rating,
            comments=comments,
        )
