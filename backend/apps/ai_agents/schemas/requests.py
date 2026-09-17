from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = None
    patient_id: Optional[str] = None
    agent_type: Optional[str] = "clinical_assistant"
    provider: Optional[str] = None
    model: Optional[str] = None
    stream: bool = False


class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVED or REJECTED")
    rationale: str = Field(default="", max_length=1000)


class AgentFeedbackRequest(BaseModel):
    rating: str = Field(..., description="HELPFUL, NOT_HELPFUL, INCORRECT, UNSAFE, MISSING_EVIDENCE")
    comments: Optional[str] = Field(default="", max_length=1000)
