import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from apps.ai_agents.models import AgentSession
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
    Celery background worker executing controlled browser agent tasks.
    Enforces timeout, independent verification, and immutable audit logging.
    """
    try:
        from integrations.laya_agent.adapter import LayaAgentAdapter
        task = LayaAgentAdapter.execute_task(task_id=task_id)
        return {"status": task.execution_status, "task_id": str(task.id)}
    except Exception as exc:
        logger.exception(f"Async browser agent task failed: {exc}")
        return {"status": "FAILED", "error": str(exc)}
