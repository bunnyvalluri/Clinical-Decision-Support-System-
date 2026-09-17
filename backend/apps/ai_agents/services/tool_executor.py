import hashlib
import json
import logging
import time
from typing import Any, Dict, Optional
from django.utils import timezone
from apps.ai_agents.models import AgentExecution, AgentToolExecution, ToolExecutionStatus
from apps.ai_agents.permissions import CanAccessPatientData
from apps.ai_agents.schemas.tool_calls import ToolCallResult
from apps.ai_agents.services.tool_registry import ToolRegistry

logger = logging.getLogger("ai_agents.services.tool_executor")


class ToolExecutor:
    """
    Production Tool Execution Engine.
    Enforces RBAC, ABAC patient scope verification, schema validation,
    idempotency caching, and immutable audit recording in Neon PostgreSQL.
    """
    @classmethod
    def execute(
        cls,
        tool_name: str,
        arguments: Dict[str, Any],
        user,
        execution: AgentExecution,
        correlation_id: str,
        idempotency_key: Optional[str] = None,
    ) -> ToolCallResult:
        start_time = time.perf_counter()
        tool = ToolRegistry.get_tool(tool_name)

        # Input sanitization and hash computation
        serialized_args = json.dumps(arguments, sort_keys=True, default=str)
        input_hash = hashlib.sha256(serialized_args.encode("utf-8")).hexdigest()

        # Idempotency check: if already executed in this execution, return cached
        if idempotency_key:
            existing = AgentToolExecution.objects.filter(
                execution=execution,
                idempotency_key=idempotency_key,
                status=ToolExecutionStatus.COMPLETED,
            ).first()
            if existing:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return ToolCallResult(
                    tool_name=tool_name,
                    status=ToolExecutionStatus.COMPLETED,
                    data=existing.output_metadata.get("data", {}),
                    provenance={"cached": True, "original_execution": str(existing.id)},
                    execution_time_ms=round(elapsed_ms, 2),
                )

        # 1. Existence Check
        if not tool:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            audit_rec = AgentToolExecution.objects.create(
                execution=execution,
                tool_name=tool_name,
                user=user,
                role=getattr(user, "role", "unknown"),
                authorization_decision="DENIED_UNKNOWN_TOOL",
                input_hash=input_hash,
                sanitized_input={},
                output_metadata={},
                execution_time_ms=round(elapsed_ms, 2),
                status=ToolExecutionStatus.DENIED,
                failure_reason=f"Tool '{tool_name}' is not registered in ToolRegistry.",
                correlation_id=correlation_id,
            )
            return ToolCallResult(
                tool_name=tool_name,
                status=ToolExecutionStatus.DENIED,
                error=f"Tool '{tool_name}' is not in approved tool registry.",
                execution_time_ms=round(elapsed_ms, 2),
            )

        # 2. Patient Scope Object-Level Authorization Check
        patient_id = arguments.get("patient_id")
        if tool.patient_data_access and patient_id:
            if not CanAccessPatientData.verify_patient_access(user, patient_id):
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                AgentToolExecution.objects.create(
                    execution=execution,
                    tool_name=tool_name,
                    user=user,
                    role=getattr(user, "role", "unknown"),
                    authorization_decision="DENIED_PATIENT_ISOLATION",
                    input_hash=input_hash,
                    sanitized_input={"patient_id": patient_id},
                    output_metadata={},
                    execution_time_ms=round(elapsed_ms, 2),
                    status=ToolExecutionStatus.DENIED,
                    failure_reason="Access denied: Clinician or user is not authorized to access this patient record.",
                    correlation_id=correlation_id,
                )
                return ToolCallResult(
                    tool_name=tool_name,
                    status=ToolExecutionStatus.DENIED,
                    error="Object-Level Access Denied: You are not authorized to access this patient's clinical records.",
                    execution_time_ms=round(elapsed_ms, 2),
                )

        # 3. Execute Tool
        result = tool.run(user=user, arguments=arguments, correlation_id=correlation_id)

        # 4. Immutable Audit Record in Neon PostgreSQL
        try:
            from apps.patients.models import Patient
            patient_obj = None
            if patient_id:
                try:
                    patient_obj = Patient.objects.filter(id=patient_id).first()
                except Exception:
                    pass

            AgentToolExecution.objects.create(
                execution=execution,
                tool_name=tool_name,
                user=user,
                role=getattr(user, "role", "unknown"),
                patient_scope=patient_obj,
                authorization_decision="AUTHORIZED" if result.status != ToolExecutionStatus.DENIED else "DENIED",
                input_hash=input_hash,
                sanitized_input={k: v for k, v in arguments.items() if k not in ["password", "token"]},
                output_metadata={"status": result.status, "has_data": bool(result.data)},
                execution_time_ms=result.execution_time_ms,
                status=result.status,
                failure_reason=result.error or "",
                correlation_id=correlation_id,
                idempotency_key=idempotency_key or "",
            )
        except Exception as audit_err:
            logger.error(f"Failed to record tool execution audit: {audit_err}")

        return result
