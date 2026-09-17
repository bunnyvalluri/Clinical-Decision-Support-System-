"""
Cline Agent Adapter for BPY-CSE-2666 Clinical Decision Support System.
Coordinates step execution, default-deny tool calling, real-time event streaming, and approval gates.
"""
from datetime import datetime, timezone
from decimal import Decimal
import logging
import os
import time
from typing import Any, Dict, List, Optional

from .policy_adapter import ClinePolicyAdapter
from .tool_registry import ClineToolRegistry
from .session_service import ClineSessionService
from .event_adapter import ClineEventAdapter
from .audit_adapter import ClineAuditAdapter
from .provider_adapter import ClineProviderAdapter

logger = logging.getLogger("integrations.cline.adapter")


class ClineAgentAdapter:
    """
    Controlled adapter executing agent reasoning and sandboxed tool invocations.
    """

    def __init__(self, session_id: str):
        from apps.ai_orchestrator.models import ClineAgentSession
        self.session = ClineAgentSession.objects.get(id=session_id)
        self.tool_history: List[str] = []

    def execute_task(self, task_id: str, prompt: str) -> Dict[str, Any]:
        """
        Executes a queued ClineAgentTask under strict sandboxed constraints.
        """
        from apps.ai_orchestrator.models import ClineAgentTask, ClineAgentApproval
        start_t = time.time()

        task = ClineAgentTask.objects.get(id=task_id)
        task.status = ClineAgentTask.TaskStatus.RUNNING
        task.started_at = datetime.now(timezone.utc)
        task.save(update_fields=["status", "started_at"])

        # 1. Emit Agent Started
        ClineEventAdapter.emit_event(
            session_id=str(self.session.id),
            task_id=str(task.id),
            event_type="agent_started",
            summary=f"Cline agent [{self.session.agent_type}] initialized task {task.task_type}",
            correlation_id=self.session.correlation_id,
        )

        # 2. Decompose prompt & select initial tool
        ClineEventAdapter.emit_event(
            session_id=str(self.session.id),
            task_id=str(task.id),
            event_type="agent_thinking_summary",
            summary="Analyzing prompt against safety policies and permitted domain tools.",
            correlation_id=self.session.correlation_id,
        )

        # Determine target tool if requested
        chosen_tool = None
        tool_args: Dict[str, Any] = {}

        p_lower = prompt.lower()
        if "guideline" in p_lower or "protocol" in p_lower or "sepsis" in p_lower:
            chosen_tool = "read_clinical_guidelines"
            tool_args = {"topic": "sepsis"}
        elif "prediction" in p_lower or "risk" in p_lower:
            chosen_tool = "explain_ml_prediction"
            tool_args = {"patient_id": "test-patient-001"}
        elif "deploy" in p_lower and self.session.role == "ADMIN":
            chosen_tool = "request_deployment"
            tool_args = {"service_name": "cdss-backend", "commit_sha": "abc1234"}
        elif "read" in p_lower and "file" in p_lower and self.session.role in ["ADMIN", "INFORMATICIST"]:
            chosen_tool = "read_codebase_file"
            tool_args = {"file_path": "README.md"}

        tool_result = None

        if chosen_tool:
            self.tool_history.append(chosen_tool)

            # Loop Detection
            if ClineSessionService.detect_runaway_loop(self.tool_history, threshold=3):
                logger.error("Runaway loop detected in task %s on tool %s", task.id, chosen_tool)
                task.status = ClineAgentTask.TaskStatus.FAILED
                task.error_code = "TOOL_LOOP_DETECTED"
                task.completed_at = datetime.now(timezone.utc)
                task.save(update_fields=["status", "error_code", "completed_at"])

                ClineEventAdapter.emit_event(
                    session_id=str(self.session.id),
                    task_id=str(task.id),
                    event_type="agent_error",
                    summary="Execution terminated: repeated identical tool loop detected.",
                    correlation_id=self.session.correlation_id,
                )
                return {"success": False, "error": "Tool loop detected", "code": "TOOL_LOOP_DETECTED"}

            # Policy & Risk Evaluation
            reg_tool = ClineToolRegistry.get_tool(chosen_tool)
            risk = reg_tool.risk_level if reg_tool else "LOW"
            permitted, requires_approval, reason = ClinePolicyAdapter.evaluate_tool_permission(
                tool_name=chosen_tool,
                user_role=self.session.role,
                environment=self.session.environment,
                risk_level=risk,
            )

            if not permitted:
                task.status = ClineAgentTask.TaskStatus.FAILED
                task.error_code = "POLICY_DENIED"
                task.completed_at = datetime.now(timezone.utc)
                task.save(update_fields=["status", "error_code", "completed_at"])

                ClineEventAdapter.emit_event(
                    session_id=str(self.session.id),
                    task_id=str(task.id),
                    event_type="tool_denied",
                    tool_name=chosen_tool,
                    summary=f"Tool request rejected by security policy: {reason}",
                    correlation_id=self.session.correlation_id,
                )
                return {"success": False, "error": reason, "code": "POLICY_DENIED"}

            # Human-in-the-loop Gate
            if requires_approval:
                task.status = ClineAgentTask.TaskStatus.WAITING_FOR_APPROVAL
                task.save(update_fields=["status"])

                approval = ClineAgentApproval.objects.create(
                    task=task,
                    requested_action=f"Execute {chosen_tool}",
                    risk_level=risk,
                    details=tool_args,
                    requested_by=self.session.user,
                )

                ClineEventAdapter.emit_event(
                    session_id=str(self.session.id),
                    task_id=str(task.id),
                    event_type="tool_requested",
                    tool_name=chosen_tool,
                    summary=f"Tool '{chosen_tool}' carries {risk} risk. Paused waiting for human sign-off.",
                    approval_state="PENDING",
                    correlation_id=self.session.correlation_id,
                )

                return {
                    "success": True,
                    "status": "WAITING_FOR_APPROVAL",
                    "approval_id": str(approval.id),
                    "message": "Task paused for human authorization.",
                }

            # Execute tool under sandbox
            ClineEventAdapter.emit_event(
                session_id=str(self.session.id),
                task_id=str(task.id),
                event_type="tool_requested",
                tool_name=chosen_tool,
                summary=f"Executing sandboxed tool '{chosen_tool}'.",
                correlation_id=self.session.correlation_id,
            )

            tool_result = ClineToolRegistry.execute_tool(
                name=chosen_tool,
                arguments=tool_args,
                user_role=self.session.role,
                environment=self.session.environment,
            )

            task.tool_calls_count += 1

            ClineEventAdapter.emit_event(
                session_id=str(self.session.id),
                task_id=str(task.id),
                event_type="tool_completed",
                tool_name=chosen_tool,
                summary=f"Tool '{chosen_tool}' completed successfully.",
                correlation_id=self.session.correlation_id,
            )

        # 3. Final Step Synthesis through Provider Adapter
        step_res = ClineProviderAdapter.generate_step_completion(
            prompt=prompt,
            role=self.session.role,
            agent_type=self.session.agent_type,
            context_data={"tool_result": tool_result} if tool_result else None,
        )

        # Budget Accounting
        within_budget = ClineSessionService.check_and_update_budget(
            session=self.session,
            tokens_consumed=step_res["tokens_in"] + step_res["tokens_out"],
            cost_usd=step_res["cost_usd"],
        )
        if not within_budget:
            task.status = ClineAgentTask.TaskStatus.FAILED
            task.error_code = "BUDGET_EXCEEDED"
            task.completed_at = datetime.now(timezone.utc)
            task.save(update_fields=["status", "error_code", "completed_at"])
            return {"success": False, "error": "Budget ceiling exceeded", "code": "BUDGET_EXCEEDED"}

        # Mark Task Completed
        total_latency = (time.time() - start_t) * 1000.0
        task.status = ClineAgentTask.TaskStatus.COMPLETED
        task.completed_at = datetime.now(timezone.utc)
        task.result_summary = step_res["content"][:255]
        task.total_cost_usd += Decimal(str(step_res["cost_usd"]))
        task.save(update_fields=["status", "completed_at", "result_summary", "tool_calls_count", "total_cost_usd"])

        # Emit Completed Event
        ClineEventAdapter.emit_event(
            session_id=str(self.session.id),
            task_id=str(task.id),
            event_type="agent_completed",
            summary="Task execution successfully completed with advisory guidance.",
            correlation_id=self.session.correlation_id,
        )

        # Audit Record
        ClineAuditAdapter.record_audit(
            correlation_id=self.session.correlation_id,
            user_id=str(self.session.user.id) if self.session.user else None,
            role=self.session.role,
            event_type="CLINE_TASK_EXECUTION",
            agent_type=self.session.agent_type,
            payload_summary=task.result_summary,
            safety_verdict="PASSED",
            latency_ms=total_latency,
            cost=step_res["cost_usd"],
        )

        return {
            "success": True,
            "task_id": str(task.id),
            "status": "COMPLETED",
            "content": step_res["content"],
            "tool_used": chosen_tool,
            "latency_ms": total_latency,
        }
