"""
Controlled Tool Calling for Ollama with Allowlist Enforcement and RBAC Gates.
"""
import logging
from typing import Any, Callable, Dict, List, Optional
from .exceptions import ToolExecutionError

logger = logging.getLogger("integrations.ollama.tool_calling")


class OllamaToolRegistry:
    """
    Allowlisted tool definitions conforming to Ollama tool calling spec.
    """

    _TOOLS: Dict[str, Dict[str, Any]] = {}
    _HANDLERS: Dict[str, Callable] = {}

    @classmethod
    def register_tool(
        cls,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        handler: Callable,
        required_roles: Optional[List[str]] = None,
    ) -> None:
        cls._TOOLS[name] = {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": parameters,
            },
            "required_roles": required_roles or ["DOCTOR", "ADMIN"],
        }
        cls._HANDLERS[name] = handler

    @classmethod
    def get_ollama_tools_for_role(cls, user_role: str) -> List[Dict[str, Any]]:
        """Returns tools matching role access privileges."""
        role_norm = user_role.upper()
        available = []
        for name, meta in cls._TOOLS.items():
            roles = [r.upper() for r in meta.get("required_roles", [])]
            if role_norm in roles or role_norm == "ADMIN":
                available.append({
                    "type": meta["type"],
                    "function": meta["function"],
                })
        return available

    @classmethod
    def execute_tool(cls, name: str, arguments: Dict[str, Any], user_role: str) -> Dict[str, Any]:
        """
        Validates permission and executes allowlisted handler.
        """
        if name not in cls._TOOLS:
            raise ToolExecutionError(f"Tool '{name}' is not registered or recognized.")

        meta = cls._TOOLS[name]
        roles = [r.upper() for r in meta.get("required_roles", [])]
        if user_role.upper() not in roles and user_role.upper() != "ADMIN":
            raise ToolExecutionError(f"User role '{user_role}' is not authorized to execute tool '{name}'.")

        handler = cls._HANDLERS.get(name)
        if not handler:
            raise ToolExecutionError(f"No execution handler registered for tool '{name}'.")

        try:
            result = handler(**arguments)
            return {"status": "success", "result": result}
        except Exception as e:
            logger.error("Tool execution failed for %s: %s", name, e)
            raise ToolExecutionError(f"Execution failed for tool '{name}': {e}")


# Register default clinical tools
def _calculate_qsofa_handler(respiratory_rate: int, systolic_bp: int, gcs_score: int) -> Dict[str, Any]:
    score = 0
    flags = []
    if respiratory_rate >= 22:
        score += 1
        flags.append("Respiratory rate >= 22 bpm (+1)")
    if systolic_bp <= 100:
        score += 1
        flags.append("Systolic BP <= 100 mmHg (+1)")
    if gcs_score < 15:
        score += 1
        flags.append("Altered mental status / GCS < 15 (+1)")

    risk = "HIGH" if score >= 2 else "LOW_TO_MODERATE"
    return {
        "qsofa_score": score,
        "risk_category": risk,
        "criteria_met": flags,
        "recommendation": "Urgent sepsis protocol evaluation" if score >= 2 else "Routine monitoring",
    }


OllamaToolRegistry.register_tool(
    name="calculate_qsofa_score",
    description="Calculate quick Sepsis-related Organ Failure Assessment (qSOFA) score",
    parameters={
        "type": "object",
        "properties": {
            "respiratory_rate": {"type": "integer", "description": "Breaths per minute"},
            "systolic_bp": {"type": "integer", "description": "Systolic blood pressure in mmHg"},
            "gcs_score": {"type": "integer", "description": "Glasgow Coma Scale score (3-15)"},
        },
        "required": ["respiratory_rate", "systolic_bp", "gcs_score"],
    },
    handler=_calculate_qsofa_handler,
    required_roles=["DOCTOR", "NURSE", "CLINICAL_INFORMATICIST", "ADMIN"],
)
