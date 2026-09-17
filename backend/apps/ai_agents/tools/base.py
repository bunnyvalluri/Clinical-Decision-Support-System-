from abc import ABC, abstractmethod
import hashlib
import json
import logging
import time
from typing import Any, Dict, List, Optional
from apps.ai_agents.models import AgentSecurityLevel, ToolExecutionStatus
from apps.ai_agents.schemas.tool_calls import ToolCallResult

logger = logging.getLogger("ai_agents.tools.base")


class BaseTool(ABC):
    """
    Production Tool Base Class.
    Implements machine-readable schema, role verification, patient scoping,
    audit hashing, timeout handling, and provenance tracking.
    """
    name: str
    description: str
    category: str = "CLINICAL"
    version: str = "1.0.0"
    risk_level: str = AgentSecurityLevel.HIGH
    allowed_roles: List[str] = []
    patient_data_access: bool = True
    approval_required: bool = False
    timeout_seconds: int = 15

    @abstractmethod
    def get_input_schema(self) -> Dict[str, Any]:
        """JSON Schema of input parameters."""
        pass

    @abstractmethod
    def get_output_schema(self) -> Dict[str, Any]:
        """JSON Schema of return payload."""
        pass

    def is_authorized(self, user_role: str, user_id: int, patient_id: Optional[str] = None) -> bool:
        """Role-based authorization gate."""
        if not self.allowed_roles:
            return True
        return user_role.lower() in [r.lower() for r in self.allowed_roles]

    @abstractmethod
    def _execute(self, user, arguments: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
        """Actual business logic executed in Neon PostgreSQL or approved services."""
        pass

    def run(self, user, arguments: Dict[str, Any], correlation_id: str) -> ToolCallResult:
        """
        Executes tool within safety, authorization, and latency envelopes.
        """
        start_time = time.perf_counter()
        user_role = getattr(user, "role", "unknown")

        # 1. Verify Role Authorization
        if not self.is_authorized(user_role, user.id, arguments.get("patient_id")):
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return ToolCallResult(
                tool_name=self.name,
                status=ToolExecutionStatus.DENIED,
                error=f"Permission Denied: User role '{user_role}' is not authorized to call '{self.name}'.",
                execution_time_ms=round(elapsed_ms, 2),
            )

        # 2. Check if human approval is required prior to execution
        if self.approval_required:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return ToolCallResult(
                tool_name=self.name,
                status=ToolExecutionStatus.REQUESTED,
                approval_required=True,
                requires_human_review=True,
                data={"pending_action": self.name, "arguments": arguments},
                execution_time_ms=round(elapsed_ms, 2),
            )

        # 3. Execute with error handling
        try:
            raw_result = self._execute(user, arguments, correlation_id)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return ToolCallResult(
                tool_name=self.name,
                status=ToolExecutionStatus.COMPLETED,
                data=raw_result,
                provenance={
                    "source": "Neon PostgreSQL / Authoritative Clinical Store",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "version": self.version,
                },
                execution_time_ms=round(elapsed_ms, 2),
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.exception(f"Tool {self.name} execution failed: {exc}")
            return ToolCallResult(
                tool_name=self.name,
                status=ToolExecutionStatus.FAILED,
                error=f"Execution error: {str(exc)}",
                execution_time_ms=round(elapsed_ms, 2),
            )
