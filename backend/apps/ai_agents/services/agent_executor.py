import logging
import time
import uuid
from typing import Any, Dict, List, Optional
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from apps.ai_agents.models import (
    AgentExecution,
    AgentExecutionStatus,
    AgentMessage,
    AgentSecurityLevel,
    AgentSession,
    AgentSessionStatus,
    DataClassification,
    SafetyEventType,
    ToolExecutionStatus,
)
from apps.ai_agents.providers.router import ProviderRouter
from apps.ai_agents.schemas.agent_state import AgentState
from apps.ai_agents.schemas.responses import AgentRunResponse, ToolExecutionDTO
from apps.ai_agents.services.agent_planner import AgentPlanner
from apps.ai_agents.services.approval_service import ApprovalService
from apps.ai_agents.services.audit_service import AuditService
from apps.ai_agents.services.checkpoint_service import CheckpointService
from apps.ai_agents.services.context_builder import ContextBuilder
from apps.ai_agents.services.memory_service import MemoryService
from apps.ai_agents.services.safety_service import SafetyService
from apps.ai_agents.services.tool_executor import ToolExecutor
from apps.ai_agents.services.validation_service import ValidationService

logger = logging.getLogger("ai_agents.services.agent_executor")


class AgentExecutor:
    """
    Core Runtime Engine for Clinical AI Agents.
    Executes the policy-governed PLAN -> ACT -> OBSERVE -> VALIDATE -> CONTINUE/STOP cycle.
    Emits real-time operational events via Django Channels.
    """
    def __init__(self):
        self.router = ProviderRouter()

    def _broadcast_event(self, session_id: str, event_type: str, payload: Dict[str, Any]):
        """Dispatches operational updates to authorized WebSocket subscribers."""
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        group_name = f"ai_agent_{session_id}"
        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "agent_event",
                    "event": {
                        "event_type": event_type,
                        "session_id": session_id,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "payload": payload,
                    },
                },
            )
        except Exception as ws_err:
            logger.debug(f"WebSocket broadcast skipped or unavailable: {ws_err}")

    def run(
        self,
        session: AgentSession,
        user_query: str,
        user,
        patient_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        request_id: Optional[str] = None,
        timeout_seconds: int = 30,
    ) -> AgentRunResponse:
        start_time = time.perf_counter()
        req_id = request_id or str(uuid.uuid4())
        corr_id = correlation_id or str(uuid.uuid4())
        session_id_str = str(session.id)
        role = getattr(user, "role", "doctor")

        # 1. Kill Switch Verification
        if not SafetyService.is_globally_enabled():
            return AgentRunResponse(
                session_id=session_id_str,
                execution_id="",
                correlation_id=corr_id,
                message={"role": "assistant", "content": "AI Agent services are currently disabled by system administrator. Standard clinical records operations continue."},
                status="CANCELLED",
            )

        # 2. Prompt Injection Defense
        is_safe, injection_reason = SafetyService.scan_prompt_for_injection(user_query)
        if not is_safe:
            SafetyService.record_safety_event(
                event_type=SafetyEventType.PROMPT_INJECTION,
                severity=AgentSecurityLevel.CRITICAL,
                details={"reason": injection_reason, "query_excerpt": user_query[:100]},
                correlation_id=corr_id,
                user=user,
            )
            return AgentRunResponse(
                session_id=session_id_str,
                execution_id="",
                correlation_id=corr_id,
                message={"role": "assistant", "content": "Safety Alert: Input violated healthcare safety policy. The query was rejected."},
                safety_flags=["PROMPT_INJECTION_DETECTED"],
                status="FAILED",
            )

        # 3. Create Execution Record
        execution = AgentExecution.objects.create(
            session=session,
            request_id=req_id,
            correlation_id=corr_id,
            status=AgentExecutionStatus.RUNNING,
            provider=session.provider,
            model=session.model,
        )
        session.status = AgentSessionStatus.RUNNING
        session.save(update_fields=["status"])

        self._broadcast_event(session_id_str, "agent.started", {"execution_id": str(execution.id), "role": role})

        # 4. Context Initialization
        definition = session.agent_definition
        allowed_tools = definition.allowed_tools if definition else []
        max_iter = definition.max_iterations if definition else 5
        max_tools = definition.max_tool_calls if definition else 10
        sys_prompt = definition.system_prompt if (definition and definition.system_prompt) else (
            "You are a Clinical AI Assistant for HealthNova AI. Ground all explanations in authoritative records. "
            "Never fabricate medical values or diagnoses. You operate under Human-in-the-Loop supervision."
        )

        state = AgentState(
            request_id=req_id,
            session_id=session_id_str,
            execution_id=str(execution.id),
            correlation_id=corr_id,
            user_id=user.id,
            role=role,
            patient_id=patient_id or (str(session.patient_id) if session.patient_id else None),
            task=user_query,
            max_iterations=max_iter,
            max_tool_calls=max_tools,
            provider=session.provider,
            model=session.model,
        )

        # Retrieve session memory preferences
        memories = MemoryService.get_session_memories(session)

        # 5. Execution Loop (PLAN -> ACT -> OBSERVE -> VALIDATE -> CONTINUE/STOP)
        tool_activity_dtos: List[ToolExecutionDTO] = []
        citations: List[Dict[str, Any]] = []

        while not state.is_terminal and state.iteration_count < state.max_iterations:
            state.iteration_count += 1
            self._broadcast_event(session_id_str, "agent.planning", {"iteration": state.iteration_count})

            # Check timeout
            if (time.perf_counter() - start_time) > timeout_seconds:
                state.is_terminal = True
                state.stop_reason = "TIMEOUT"
                break

            # Planner determines next action
            next_tool_call = AgentPlanner.plan_next_step(state, allowed_tools)
            if not next_tool_call:
                break

            # Broadcast Tool Requested
            self._broadcast_event(session_id_str, "agent.tool_requested", {"tool_name": next_tool_call.tool_name})

            # Execute Tool
            tool_res = ToolExecutor.execute(
                tool_name=next_tool_call.tool_name,
                arguments=next_tool_call.arguments,
                user=user,
                execution=execution,
                correlation_id=corr_id,
            )

            # Check if approval is required
            if tool_res.approval_required or tool_res.requires_human_review:
                self._broadcast_event(session_id_str, "agent.waiting_approval", {"tool_name": next_tool_call.tool_name})
                approval_rec = ApprovalService.request_approval(
                    execution=execution,
                    session=session,
                    requested_action=next_tool_call.tool_name,
                    reason=f"Clinical tool '{next_tool_call.tool_name}' requires human physician sign-off.",
                    action_payload=next_tool_call.arguments,
                    affected_patient=session.patient,
                    risk_level=AgentSecurityLevel.CRITICAL,
                    evidence_summary=tool_res.data,
                )
                state.approval_required = True
                state.approval_details = {
                    "approval_id": str(approval_rec.id),
                    "action": approval_rec.requested_action,
                    "reason": approval_rec.reason,
                    "risk_level": approval_rec.risk_level,
                }
                state.is_terminal = True
                break

            # Record Tool Observation
            state.tool_calls.append({"tool": next_tool_call.tool_name, "arguments": next_tool_call.arguments})
            state.tool_results.append({"tool_name": next_tool_call.tool_name, "status": tool_res.status, "data": tool_res.data, "error": tool_res.error})

            # Harvest citations if returned from RAG or Clinical tools
            if "results" in tool_res.data and isinstance(tool_res.data["results"], list):
                for doc in tool_res.data["results"]:
                    if isinstance(doc, dict) and "title" in doc:
                        citations.append({
                            "title": doc.get("title"),
                            "source_id": doc.get("document_id", ""),
                            "url": doc.get("source_url", ""),
                            "passage": doc.get("passage", "")[:200],
                            "evidence_level": doc.get("evidence_level", "Standard"),
                        })

            tool_activity_dtos.append(ToolExecutionDTO(
                tool_name=next_tool_call.tool_name,
                status=tool_res.status,
                execution_time_ms=tool_res.execution_time_ms,
                authorized=tool_res.status != ToolExecutionStatus.DENIED,
                summary=f"Execution completed in {tool_res.execution_time_ms}ms.",
            ))

            self._broadcast_event(session_id_str, "agent.tool_completed", {
                "tool_name": next_tool_call.tool_name,
                "status": tool_res.status,
                "latency_ms": tool_res.execution_time_ms,
            })

        # 6. Response Synthesis
        if state.approval_required:
            final_content = "This clinical action requires independent human physician approval. An approval card has been queued for your review."
        else:
            context = ContextBuilder.build_context(
                user=user,
                role=role,
                patient_id=state.patient_id,
                retrieved_facts=[tr["data"] for tr in state.tool_results if tr["data"]],
                retrieved_docs=citations,
                memories=memories,
            )
            prompt_messages = ContextBuilder.format_prompt_messages(
                system_policy=sys_prompt,
                user_query=user_query,
                context=context,
                tool_results=state.tool_results,
            )

            # Route through Provider
            classification = DataClassification.PHI if state.patient_id else DataClassification.PUBLIC
            provider_resp = self.router.route_and_generate(
                messages=prompt_messages,
                requested_provider=session.provider,
                data_classification=classification,
                model=session.model,
            )
            final_content = provider_resp.content

        # 7. Output Validation & Hallucination Check
        is_valid, sanitized_content, safety_flags = ValidationService.validate_clinical_output(
            text=final_content,
            user_role=role,
            has_citations=bool(citations),
        )
        grounding_score = ValidationService.check_hallucination_indicators(
            response_text=sanitized_content,
            retrieved_facts=[tr["data"] for tr in state.tool_results if tr["data"]],
        )

        elapsed_total_ms = (time.perf_counter() - start_time) * 1000.0

        # 8. Checkpoint & Finalize
        execution.status = AgentExecutionStatus.WAITING_APPROVAL if state.approval_required else AgentExecutionStatus.COMPLETED
        execution.latency_ms = round(elapsed_total_ms, 2)
        execution.completed_at = timezone.now()
        execution.iteration_count = state.iteration_count
        execution.tool_call_count = len(state.tool_calls)
        execution.save()

        session.status = AgentSessionStatus.WAITING_APPROVAL if state.approval_required else AgentSessionStatus.COMPLETED
        session.save()

        # Record Messages in Neon PostgreSQL
        CheckpointService.record_message(
            session=session,
            execution=execution,
            role="user",
            content=user_query,
        )
        ai_msg = CheckpointService.record_message(
            session=session,
            execution=execution,
            role="assistant",
            content=sanitized_content,
            tool_calls=state.tool_calls,
            tool_results=state.tool_results,
            citations=citations,
            grounding_status="GROUNDED" if grounding_score >= 0.8 else "PROVISIONAL",
            grounding_confidence=grounding_score,
            requires_approval=state.approval_required,
        )

        # Audit Log
        AuditService.record_agent_audit(
            action="EXECUTION_COMPLETE",
            user=user,
            execution=execution,
            correlation_id=corr_id,
            patient_id=state.patient_id,
            details={"iterations": state.iteration_count, "tools": len(state.tool_calls)},
        )

        self._broadcast_event(session_id_str, "agent.completed", {
            "execution_id": str(execution.id),
            "status": execution.status,
            "latency_ms": execution.latency_ms,
        })

        return AgentRunResponse(
            session_id=session_id_str,
            execution_id=str(execution.id),
            correlation_id=corr_id,
            message={
                "id": str(ai_msg.id),
                "role": "assistant",
                "content": sanitized_content,
                "model_name": session.model,
                "tool_calls": state.tool_calls,
            },
            citations=citations,
            grounding_status=ai_msg.grounding_status,
            grounding_confidence=grounding_score,
            requires_human_approval=state.approval_required,
            approval_details=state.approval_details,
            tool_activity=tool_activity_dtos,
            safety_flags=safety_flags,
            iteration_count=state.iteration_count,
            latency_ms=round(elapsed_total_ms, 2),
            status=execution.status,
        )
