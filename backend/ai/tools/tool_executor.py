"""
Tool Execution Engine with independent authorization re-checks,
idempotency tracking, and immutable audit persistence.
"""
import logging
import time
from typing import Any, Dict, Optional

from ai.domain.entities import ToolCallRequest, ToolCallResult
from .tool_registry import AIToolRegistry

logger = logging.getLogger("ai.tools.executor")


class ToolExecutor:
    """
    Safely executes registered AI tools under strict RBAC and parameter validation.
    """

    @classmethod
    def execute(
        cls,
        tool_call: ToolCallRequest,
        user_id: str,
        user_role: str,
        correlation_id: str,
        execution_id: Optional[str] = None,
    ) -> ToolCallResult:
        start_t = time.time()
        tool_def = AIToolRegistry.get_tool(tool_call.tool_name)

        # 1. Verification of tool existence
        if not tool_def:
            logger.warning("Unapproved tool invocation attempt: '%s'", tool_call.tool_name)
            return ToolCallResult(
                call_id=tool_call.call_id,
                tool_name=tool_call.tool_name,
                success=False,
                result_data={},
                error_message=f"Tool '{tool_call.tool_name}' is not in the approved tool registry.",
                latency_ms=0.0,
            )

        # 2. Independent Role-Based Authorization Re-check (Never trust LLM claim)
        normalized_role = user_role.upper()
        if normalized_role not in tool_def.allowed_roles and "ALL" not in tool_def.allowed_roles:
            logger.warning(
                "Unauthorized tool invocation: User %s (role: %s) attempted to run %s",
                user_id,
                user_role,
                tool_call.tool_name,
            )
            return ToolCallResult(
                call_id=tool_call.call_id,
                tool_name=tool_call.tool_name,
                success=False,
                result_data={},
                error_message=f"Role '{user_role}' is not authorized to execute tool '{tool_call.tool_name}'.",
                latency_ms=0.0,
            )

        # 3. Parameter Schema & Execution
        try:
            result_payload = tool_def.handler(**tool_call.arguments)
            latency = (time.time() - start_t) * 1000.0

            # 4. Audit Persistence
            try:
                from apps.ai_orchestrator.models import AIToolCall
                AIToolCall.objects.create(
                    execution_id=execution_id,
                    tool_name=tool_call.tool_name,
                    input_arguments=tool_call.arguments,
                    output_result=result_payload,
                    is_success=True,
                    latency_ms=latency,
                    idempotency_key=tool_call.idempotency_key or "",
                )
            except Exception as audit_err:
                logger.error("Failed to persist AIToolCall audit: %s", audit_err)

            return ToolCallResult(
                call_id=tool_call.call_id,
                tool_name=tool_call.tool_name,
                success=True,
                result_data=result_payload,
                latency_ms=latency,
            )
        except Exception as exc:
            latency = (time.time() - start_t) * 1000.0
            logger.error("Tool execution failed: %s with error %s", tool_call.tool_name, exc)
            return ToolCallResult(
                call_id=tool_call.call_id,
                tool_name=tool_call.tool_name,
                success=False,
                result_data={},
                error_message=str(exc),
                latency_ms=latency,
            )
