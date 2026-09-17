"""
Session Service for Cline Agent Execution.
Manages session state machines, budget enforcement, runaway loop detection, and checkpoints.
"""
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import logging
import os
import uuid
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("integrations.cline.sessions")


class ClineSessionService:
    """
    Coordinates lifecycle and governance of ClineAgentSession and ClineAgentTask entities.
    """

    @classmethod
    def create_session(
        cls,
        user: Any,
        role: str,
        agent_type: str,
        purpose: str,
        environment: str = "DEVELOPMENT",
        token_budget: int = 100000,
        max_tool_calls: int = 20,
        cost_limit_usd: float = 2.00,
    ) -> Any:
        """
        Initializes an authenticated, bounded ClineAgentSession.
        """
        from apps.ai_orchestrator.models import ClineAgentSession
        from .policy_adapter import ClinePolicyAdapter

        # Check role permission for agent type
        allowed, msg = ClinePolicyAdapter.can_access_agent_type(role, agent_type)
        if not allowed:
            raise PermissionError(f"Access Denied: {msg}")

        correlation_id = f"cline-sess-{uuid.uuid4().hex[:12]}"

        session = ClineAgentSession.objects.create(
            user=user,
            role=role.upper(),
            agent_type=agent_type,
            purpose=purpose,
            status=ClineAgentSession.SessionStatus.ACTIVE,
            correlation_id=correlation_id,
            environment=environment.upper(),
            token_budget=token_budget,
            max_tool_calls=max_tool_calls,
            cost_limit_usd=Decimal(str(cost_limit_usd)),
        )

        logger.info("Initialized ClineAgentSession %s for user %s (%s)", session.id, getattr(user, "username", user), role)
        return session

    @classmethod
    def create_task(
        cls,
        session_id: str,
        prompt: str,
        task_type: str = "QUERY_ANALYSIS",
        user: Optional[Any] = None,
    ) -> Any:
        """
        Queues a new task under a session, computing a SHA-256 prompt hash.
        """
        from apps.ai_orchestrator.models import ClineAgentSession, ClineAgentTask
        from ai.safety.phi_redactor import PHIRedactor

        session = ClineAgentSession.objects.get(id=session_id)
        if session.status == ClineAgentSession.SessionStatus.TERMINATED:
            raise ValueError("Cannot submit task to a terminated agent session.")

        # Emergency kill switch check
        if os.environ.get("AI_KILL_SWITCH_ACTIVE") == "true":
            raise PermissionError("AI task dispatch blocked: Global Kill Switch is ACTIVE.")

        # Compute SHA-256 of prompt to avoid storing raw PHI
        prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
        redacted_summary, _ = PHIRedactor.redact(prompt[:120])

        task = ClineAgentTask.objects.create(
            session=session,
            task_type=task_type,
            prompt_hash=prompt_hash,
            prompt_summary=redacted_summary,
            status=ClineAgentTask.TaskStatus.QUEUED,
            created_by=user,
        )

        return task

    @classmethod
    def check_and_update_budget(
        cls,
        session: Any,
        tokens_consumed: int,
        cost_usd: float,
    ) -> bool:
        """
        Enforces token and cost ceilings. Returns True if within budget, False if exceeded.
        """
        session.tokens_used += tokens_consumed
        session.total_cost_usd += Decimal(str(round(cost_usd, 4)))
        session.save(update_fields=["tokens_used", "total_cost_usd", "updated_at"])

        if session.tokens_used > session.token_budget:
            logger.warning("Session %s exceeded token budget (%d > %d)", session.id, session.tokens_used, session.token_budget)
            session.status = "TERMINATED"
            session.save(update_fields=["status"])
            return False

        if session.total_cost_usd > session.cost_limit_usd:
            logger.warning("Session %s exceeded cost ceiling ($%s > $%s)", session.id, session.total_cost_usd, session.cost_limit_usd)
            session.status = "TERMINATED"
            session.save(update_fields=["status"])
            return False

        return True

    @classmethod
    def detect_runaway_loop(cls, recent_tool_calls: List[str], threshold: int = 3) -> bool:
        """
        Detects if the agent is stuck repeatedly executing the same tool.
        """
        if len(recent_tool_calls) < threshold:
            return False
        last_tools = recent_tool_calls[-threshold:]
        return len(set(last_tools)) == 1
