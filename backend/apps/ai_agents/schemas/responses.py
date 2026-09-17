from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ToolExecutionDTO(BaseModel):
    tool_name: str
    status: str
    execution_time_ms: float
    authorized: bool
    summary: str = ""


class RiskExplanationDTO(BaseModel):
    prediction_id: str
    risk_score: float
    risk_category: str
    confidence: float
    top_features: List[Dict[str, Any]]
    model_version: str
    explanation: str


class AgentRunResponse(BaseModel):
    session_id: str
    execution_id: str
    correlation_id: str
    message: Dict[str, Any]
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    grounding_status: str = "GROUNDED"
    grounding_confidence: float = 1.0
    requires_human_approval: bool = False
    approval_details: Optional[Dict[str, Any]] = None
    tool_activity: List[ToolExecutionDTO] = Field(default_factory=list)
    safety_flags: List[str] = Field(default_factory=list)
    iteration_count: int = 0
    latency_ms: float = 0.0
    status: str = "COMPLETED"
