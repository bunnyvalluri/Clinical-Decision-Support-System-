"""
Celery Background Tasks for Asynchronous Cline Agent Execution.
Executes long-running engineering, code review, MLOps, and documentation workflows in isolated workers.
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger("celery.cline_tasks")


@shared_task(name="celery_tasks.cline_tasks.execute_cline_task_async", queue="default")
def execute_cline_task_async(session_id: str, task_id: str, prompt: str) -> dict:
    """
    Executes a queued ClineAgentTask in an isolated background Celery worker thread.
    """
    from integrations.cline.adapter import ClineAgentAdapter
    from apps.ai_orchestrator.models import ClineAgentTask

    logger.info("Starting Celery background execution for Cline task: %s (session %s)", task_id, session_id)
    try:
        adapter = ClineAgentAdapter(session_id=session_id)
        result = adapter.execute_task(task_id=task_id, prompt=prompt)
        logger.info("Completed Celery execution for task %s with status: %s", task_id, result.get("status"))
        return result
    except Exception as exc:
        logger.error("Celery worker failed for Cline task %s: %s", task_id, exc)
        task = ClineAgentTask.objects.filter(id=task_id).first()
        if task:
            task.status = ClineAgentTask.TaskStatus.FAILED
            task.error_code = "WORKER_EXCEPTION"
            task.completed_at = timezone.now()
            task.save(update_fields=["status", "error_code", "completed_at"])
        return {"success": False, "error": str(exc), "code": "WORKER_EXCEPTION"}


@shared_task(name="celery_tasks.cline_tasks.emergency_kill_cline_task", queue="default")
def emergency_kill_cline_task(task_id: str, admin_reason: str = "Administrator Emergency Stop") -> dict:
    """
    Terminates a running or queued ClineAgentTask immediately.
    """
    from apps.ai_orchestrator.models import ClineAgentTask
    from integrations.cline.event_adapter import ClineEventAdapter

    task = ClineAgentTask.objects.filter(id=task_id).first()
    if not task:
        return {"success": False, "error": "Task not found"}

    task.status = ClineAgentTask.TaskStatus.CANCELLED
    task.error_code = "ADMIN_TERMINATED"
    task.completed_at = timezone.now()
    task.save(update_fields=["status", "error_code", "completed_at"])

    ClineEventAdapter.emit_event(
        session_id=str(task.session_id),
        task_id=str(task.id),
        event_type="agent_error",
        summary=f"Task forcibly terminated by administrator: {admin_reason}",
        correlation_id=task.session.correlation_id,
    )

    logger.warning("Emergency stop executed for task %s: %s", task_id, admin_reason)
    return {"success": True, "task_id": str(task_id), "status": "CANCELLED"}


@shared_task(name="celery_tasks.cline_tasks.scheduled_cline_agent_check", queue="default")
def scheduled_cline_agent_check() -> dict:
    """
    Periodic health check and stalled agent task reaper.
    Cancels any tasks that have been in RUNNING status for longer than 300 seconds.
    """
    from datetime import timedelta
    from apps.ai_orchestrator.models import ClineAgentTask

    cutoff = timezone.now() - timedelta(seconds=300)
    stalled_tasks = ClineAgentTask.objects.filter(
        status=ClineAgentTask.TaskStatus.RUNNING,
        started_at__lt=cutoff,
    )
    reaped_count = 0
    for t in stalled_tasks:
        t.status = ClineAgentTask.TaskStatus.TIMED_OUT
        t.error_code = "EXECUTION_TIMEOUT"
        t.completed_at = timezone.now()
        t.save(update_fields=["status", "error_code", "completed_at"])
        reaped_count += 1

    logger.info("Scheduled agent task reaper cleaned up %d stalled tasks", reaped_count)
    return {"reaped_count": reaped_count}
