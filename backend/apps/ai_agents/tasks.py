import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from apps.ai_agents.models import AgentSession, BrowserAgentTask, BrowserTaskState
from apps.ai_agents.schemas.requests import AgentRunRequest
from apps.ai_agents.services.agent_service import AgentService

logger = logging.getLogger("ai_agents.tasks")
User = get_user_model()


@shared_task(name="apps.ai_agents.tasks.execute_async_agent_task")
def execute_async_agent_task(
    session_id: str,
    query: str,
    user_id: int,
    patient_id: str = None,
    correlation_id: str = None,
):
    """
    Celery background worker task for long-running agent workflows or reports.
    """
    try:
        user = User.objects.get(id=user_id)
        session = AgentSession.objects.get(id=session_id)
        service = AgentService()
        req = AgentRunRequest(
            session_id=session_id,
            query=query,
            patient_id=patient_id,
        )
        result = service.execute_turn(user=user, request_dto=req, correlation_id=correlation_id)
        return {"status": "SUCCESS", "execution_id": result.execution_id}
    except Exception as exc:
        logger.exception(f"Async agent task failed: {exc}")
        return {"status": "FAILED", "error": str(exc)}


@shared_task(name="apps.ai_agents.tasks.execute_browser_agent_task_async")
def execute_browser_agent_task_async(task_id: str):
    """
    Celery background worker executing controlled browser agent tasks through BrowserAgentGateway.
    Enforces timeout, independent verification, and immutable audit logging.
    """
    try:
        from integrations.browser_agent.gateway import BrowserAgentGateway
        result = BrowserAgentGateway.start_task(task_id=task_id)
        return {"status": result.get("status"), "task_id": task_id}
    except Exception as exc:
        logger.exception(f"Async browser agent task failed: {exc}")
        return {"status": "FAILED", "error": str(exc)}


@shared_task(name="apps.ai_agents.tasks.cleanup_expired_browser_sessions")
def cleanup_expired_browser_sessions():
    """
    Periodic task to clean up old browser execution artifacts and close orphaned sessions.
    """
    try:
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(hours=24)
        expired_count = BrowserAgentTask.objects.filter(
            execution_status=BrowserTaskState.RUNNING,
            started_at__lt=cutoff,
        ).update(
            execution_status=BrowserTaskState.EXPIRED,
            failure_reason="Execution timed out after 24 hours.",
        )
        logger.info("Cleaned up %d expired browser agent tasks.", expired_count)
        return {"cleaned_up": expired_count}
    except Exception as exc:
        logger.exception("Error cleaning up browser sessions: %s", exc)
        return {"error": str(exc)}


@shared_task(name="apps.ai_agents.tasks.health_check_browser_providers")
def health_check_browser_providers():
    """
    Periodic diagnostics across registered browser runtime providers.
    """
    try:
        from integrations.browser_agent.gateway import BrowserAgentGateway
        providers = BrowserAgentGateway.list_providers()
        return {"providers": providers}
    except Exception as exc:
        logger.exception("Error checking browser providers: %s", exc)
        return {"error": str(exc)}
