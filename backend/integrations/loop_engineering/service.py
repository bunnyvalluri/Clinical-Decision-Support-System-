"""
Loop Engineering High-Level Orchestration Service (Prompt 45).
Coordinates run execution, Channels streaming, audit logs, and budget enforcement.
"""
import logging
from typing import Dict, Any, Optional
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.engineering_loops.models import (
    EngineeringLoop,
    EngineeringLoopRun,
    EngineeringLoopAuditEvent,
    EngineeringLoopBudget,
    LoopStatus,
    AutonomyLevel,
)
from integrations.loop_engineering.adapter import LoopAdapter
from integrations.loop_engineering.policies import LoopPolicyEngine

logger = logging.getLogger("integrations.loop_engineering.service")


class LoopService:
    """Enterprise service facade for engineering loops."""

    @classmethod
    def broadcast_event(cls, event_type: str, data: Dict[str, Any]) -> None:
        """Emits authorized event to Django Channels."""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "engineering_loops",
                    {
                        "type": "loop_event",
                        "event": event_type,
                        "data": data,
                        "timestamp": timezone.now().isoformat(),
                    },
                )
        except Exception as e:
            logger.debug(f"Channels broadcast skipped: {e}")

    @classmethod
    def execute_run(cls, run_id: str) -> Dict[str, Any]:
        """Executes a loop run end-to-end."""
        LoopPolicyEngine.check_kill_switch()

        run = EngineeringLoopRun.objects.filter(run_id=run_id).first()
        if not run:
            return {"error": f"Run {run_id} not found"}

        # Validate loop policy
        ok, reason = LoopPolicyEngine.can_execute_operation(run.loop, "DISCOVER")
        if not ok:
            run.status = LoopStatus.FAILED
            run.error = reason
            run.save(update_fields=["status", "error"])
            cls.broadcast_event("loop.policy.denied", {"run_id": run_id, "reason": reason})
            return {"status": "FAILED", "error": reason}

        # Check budget limit
        try:
            LoopPolicyEngine.check_budget_limit(run.cost_estimate or 0.05)
        except Exception as exc:
            run.status = LoopStatus.FAILED
            run.error = str(exc)
            run.save(update_fields=["status", "error"])
            cls.broadcast_event("loop.budget.exceeded", {"run_id": run_id, "error": str(exc)})
            return {"status": "FAILED", "error": str(exc)}

        run.status = LoopStatus.RUNNING
        run.started_at = timezone.now()
        run.save(update_fields=["status", "started_at"])
        cls.broadcast_event("loop.run.started", {"run_id": run_id, "loop": run.loop.name})

        adapter = LoopAdapter(run)
        try:
            res = adapter.execute()
            run.status = LoopStatus.COMPLETED
            run.completed_at = timezone.now()
            run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
            run.summary = res.get("summary", "")
            run.save()

            # Record spend in budget
            budget = EngineeringLoopBudget.objects.first()
            if budget:
                budget.current_daily_spend += run.actual_cost
                budget.current_weekly_spend += run.actual_cost
                budget.save(update_fields=["current_daily_spend", "current_weekly_spend"])

            # Immutable audit event
            EngineeringLoopAuditEvent.objects.create(
                loop=run.loop,
                run=run,
                action="LOOP_RUN_COMPLETED",
                metadata={
                    "pattern": run.loop.pattern,
                    "autonomy": run.loop.autonomy_level,
                    "cost": run.actual_cost,
                    "ready_score": run.loop_ready_score,
                },
                correlation_id=run.correlation_id,
            )

            cls.broadcast_event("loop.run.completed", {"run_id": run_id, "ready_score": run.loop_ready_score})
            return {"status": "COMPLETED", "run_id": run_id, "ready_score": run.loop_ready_score}

        except Exception as exc:
            logger.error(f"Error executing loop run {run_id}: {exc}", exc_info=True)
            run.status = LoopStatus.FAILED
            run.error = str(exc)
            run.completed_at = timezone.now()
            run.save(update_fields=["status", "error", "completed_at"])
            cls.broadcast_event("loop.run.failed", {"run_id": run_id, "error": str(exc)})
            raise
        finally:
            adapter.cleanup()
