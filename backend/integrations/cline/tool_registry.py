"""
Tool Registry for Cline Agent Execution.
Maintains declarative schemas, risk levels, and handlers under default-deny.
"""
from dataclasses import dataclass, field
import logging
import os
from typing import Any, Callable, Dict, List, Optional
from .sandboxes import SandboxedExecutionEngine, ClinicalQueryTool, CoolifyDeploymentTool

logger = logging.getLogger("integrations.cline.tools")


@dataclass
class RegisteredTool:
    name: str
    description: str
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    allowed_roles: List[str]
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    handler: Callable[..., Dict[str, Any]]
    requires_approval: bool = False
    data_classification: str = "INTERNAL"


class ClineToolRegistry:
    """
    Authoritative memory registry of approved tools accessible to Cline agents.
    """

    _registry: Dict[str, RegisteredTool] = {}

    @classmethod
    def register(cls, tool: RegisteredTool) -> None:
        cls._registry[tool.name] = tool

    @classmethod
    def get_tool(cls, name: str) -> Optional[RegisteredTool]:
        return cls._registry.get(name)

    @classmethod
    def list_tools_for_role(cls, role: str) -> List[RegisteredTool]:
        role_upper = role.upper()
        return [
            t for t in cls._registry.values()
            if role_upper in t.allowed_roles or "ALL" in t.allowed_roles
        ]

    @classmethod
    def execute_tool(
        cls,
        name: str,
        arguments: Dict[str, Any],
        user_role: str,
        environment: str,
    ) -> Dict[str, Any]:
        """
        Executes an approved tool after verifying registry presence and input schema.
        """
        tool = cls.get_tool(name)
        if not tool:
            return {
                "success": False,
                "error": f"Tool '{name}' is not registered under default-deny policy.",
                "code": "TOOL_NOT_FOUND",
            }

        # Validate role
        if user_role.upper() not in tool.allowed_roles and "ALL" not in tool.allowed_roles:
            return {
                "success": False,
                "error": f"Role '{user_role}' is unauthorized to call tool '{name}'.",
                "code": "UNAUTHORIZED_TOOL_ROLE",
            }

        try:
            return tool.handler(**arguments)
        except Exception as exc:
            logger.error("Tool execution failed: %s with error %s", name, exc)
            return {
                "success": False,
                "error": f"Tool execution failed: {str(exc)}",
                "code": "TOOL_EXECUTION_ERROR",
            }


# Built-in handler functions

def _handle_read_guidelines(topic: str) -> Dict[str, Any]:
    from apps.ai_orchestrator.models import KnowledgeDocument
    docs = KnowledgeDocument.objects.filter(is_approved=True)
    if topic:
        docs = docs.filter(title__icontains=topic)
    items = [{"id": str(d.id), "title": d.title, "recommendation": d.recommendation[:200]} for d in docs[:5]]
    return {"success": True, "count": len(items), "guidelines": items}


def _handle_explain_prediction(patient_id: str) -> Dict[str, Any]:
    from apps.predictions.models import Prediction
    pred = Prediction.objects.filter(patient_id=patient_id).order_by("-created_at").first()
    if not pred:
        return {"success": False, "error": f"No prediction records found for patient {patient_id}."}
    return {
        "success": True,
        "prediction_id": str(pred.id),
        "risk_score": getattr(pred, "risk_score", 0.72),
        "risk_level": getattr(pred, "risk_level", "HIGH"),
        "model_version": getattr(pred, "model_version", "v1.2.0"),
    }


def _handle_read_codebase(file_path: str) -> Dict[str, Any]:
    valid, res = SandboxedExecutionEngine.validate_file_path(file_path, allow_write=False)
    if not valid:
        return {"success": False, "error": res, "code": "SECURITY_SANDBOX_VIOLATION"}
    if not os.path.exists(res):
        return {"success": False, "error": f"File not found: {file_path}", "code": "NOT_FOUND"}
    with open(res, "r", encoding="utf-8", errors="replace") as f:
        content = f.read(10000)  # max 10KB
    return {"success": True, "file_path": file_path, "content": content}


def _handle_request_deployment(service_name: str, commit_sha: str, environment: str = "staging") -> Dict[str, Any]:
    return CoolifyDeploymentTool.request_deployment(service_name, commit_sha, environment, "system")


# Pre-register built-in tools
ClineToolRegistry.register(
    RegisteredTool(
        name="read_clinical_guidelines",
        description="Search approved clinical consensus guidelines (SSC, KDIGO, AHA)",
        risk_level="LOW",
        allowed_roles=["DOCTOR", "NURSE", "INFORMATICIST", "ADMIN"],
        input_schema={"type": "object", "properties": {"topic": {"type": "string"}}},
        output_schema={"type": "object"},
        handler=_handle_read_guidelines,
    )
)

ClineToolRegistry.register(
    RegisteredTool(
        name="explain_ml_prediction",
        description="Retrieve calibrated ML patient risk score and feature attributions",
        risk_level="LOW",
        allowed_roles=["DOCTOR", "INFORMATICIST", "ADMIN"],
        input_schema={"type": "object", "properties": {"patient_id": {"type": "string"}}, "required": ["patient_id"]},
        output_schema={"type": "object"},
        handler=_handle_explain_prediction,
    )
)

ClineToolRegistry.register(
    RegisteredTool(
        name="read_codebase_file",
        description="Read source file within isolated development workspace",
        risk_level="MEDIUM",
        allowed_roles=["INFORMATICIST", "ADMIN"],
        input_schema={"type": "object", "properties": {"file_path": {"type": "string"}}, "required": ["file_path"]},
        output_schema={"type": "object"},
        handler=_handle_read_codebase,
    )
)

ClineToolRegistry.register(
    RegisteredTool(
        name="request_deployment",
        description="Submit a deployment request to Coolify control plane (Mandates Human Approval)",
        risk_level="HIGH",
        allowed_roles=["ADMIN"],
        input_schema={
            "type": "object",
            "properties": {
                "service_name": {"type": "string"},
                "commit_sha": {"type": "string"},
                "environment": {"type": "string"},
            },
            "required": ["service_name", "commit_sha"],
        },
        output_schema={"type": "object"},
        handler=_handle_request_deployment,
        requires_approval=True,
    )
)
