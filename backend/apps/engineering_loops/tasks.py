"""
Celery background tasks for Engineering Loops (Prompt 45).
Runs on dedicated 'engineering_loops' queue.
"""
import logging
import uuid
from celery import shared_task
from apps.engineering_loops.models import EngineeringLoop, EngineeringLoopRun, LoopStatus
from integrations.loop_engineering.service import LoopService
from integrations.loop_engineering.client import LoopClient
from integrations.loop_engineering.runner import WorktreeManager

logger = logging.getLogger("apps.engineering_loops.tasks")


@shared_task(
    name="apps.engineering_loops.tasks.run_engineering_loop",
    queue="engineering_loops",
    time_limit=360,
    soft_time_limit=330,
    bind=True,
    max_retries=0,
)
def run_engineering_loop(self, run_id: str):
    """Executes a loop run in an isolated worktree."""
    logger.info(f"[Task] run_engineering_loop run_id={run_id}")
    return LoopService.execute_run(run_id)


@shared_task(
    name="apps.engineering_loops.tasks.run_loop_doctor",
    queue="engineering_loops",
    time_limit=120,
    bind=True,
)
def run_loop_doctor(self, loop_id: str):
    """Executes loop doctor health evaluation."""
    temp_run_id = f"doc_{uuid.uuid4().hex[:8]}"
    wt = WorktreeManager.create_worktree(temp_run_id)
    try:
        client = LoopClient(wt)
        return client.doctor()
    finally:
        WorktreeManager.cleanup_worktree(temp_run_id)


@shared_task(
    name="apps.engineering_loops.tasks.run_loop_audit",
    queue="engineering_loops",
    time_limit=120,
    bind=True,
)
def run_loop_audit(self, loop_id: str):
    """Executes loop audit governance check."""
    temp_run_id = f"audit_{uuid.uuid4().hex[:8]}"
    wt = WorktreeManager.create_worktree(temp_run_id)
    try:
        client = LoopClient(wt)
        return client.audit()
    finally:
        WorktreeManager.cleanup_worktree(temp_run_id)


@shared_task(
    name="apps.engineering_loops.tasks.cleanup_loop_workspace",
    queue="engineering_loops",
    time_limit=60,
)
def cleanup_loop_workspace(self, run_id: str):
    """Cleans up an ephemeral worktree."""
    WorktreeManager.cleanup_worktree(run_id)
    return {"cleaned": run_id}
