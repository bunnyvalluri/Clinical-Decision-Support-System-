"""
AI Tool Registry defining allowlisted tool schemas, permissions, and risk tiers.
"""
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional
from ai.domain.entities import ActionLevel


@dataclass
class ToolDefinition:
    name: str
    description: str
    action_level: ActionLevel
    allowed_roles: List[str]
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    handler: Callable[..., Dict[str, Any]]
    timeout_seconds: int = 5
    requires_idempotency: bool = False


class AIToolRegistry:
    """
    Central registry of approved and audited AI execution tools.
    """

    _tools: Dict[str, ToolDefinition] = {}

    @classmethod
    def register(cls, tool: ToolDefinition) -> None:
        cls._tools[tool.name] = tool

    @classmethod
    def get_tool(cls, name: str) -> Optional[ToolDefinition]:
        return cls._tools.get(name)

    @classmethod
    def list_tools_for_role(cls, role: str) -> List[ToolDefinition]:
        normalized_role = role.upper()
        return [
            tool
            for tool in cls._tools.values()
            if normalized_role in tool.allowed_roles or "ALL" in tool.allowed_roles
        ]

    @classmethod
    def get_schemas_for_provider(cls, role: str) -> List[Dict[str, Any]]:
        """
        Formats tools as JSON schemas for OpenAI/Anthropic/Gemini function calling.
        """
        schemas = []
        for tool in cls.list_tools_for_role(role):
            schemas.append(
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.input_schema,
                    },
                }
            )
        return schemas
