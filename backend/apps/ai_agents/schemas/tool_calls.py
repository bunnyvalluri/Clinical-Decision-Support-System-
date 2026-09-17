from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ToolCallRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    rationale: Optional[str] = None
    idempotency_key: Optional[str] = None


class ToolCallResult(BaseModel):
    tool_name: str
    status: str
    data: Dict[str, Any] = Field(default_factory=dict)
    provenance: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: float = 0.0
    error: Optional[str] = None
    approval_required: bool = False
    requires_human_review: bool = False
