from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentState(BaseModel):
    """
    Controlled operational state model for agent loop.
    Contains strictly operational metadata, grounded evidence, and safety flags.
    Zero hidden chain-of-thought stored.
    """
    request_id: str
    session_id: str
    execution_id: str
    correlation_id: str
    user_id: int
    role: str
    patient_id: Optional[str] = None
    task: str
    authorized_context: Dict[str, Any] = Field(default_factory=dict)
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    tool_results: List[Dict[str, Any]] = Field(default_factory=list)
    retrieved_documents: List[Dict[str, Any]] = Field(default_factory=list)
    clinical_facts: List[Dict[str, Any]] = Field(default_factory=list)
    uncertainty: float = 0.0
    confidence: float = 1.0
    approval_required: bool = False
    approval_details: Optional[Dict[str, Any]] = None
    approval_status: Optional[str] = None
    safety_flags: List[str] = Field(default_factory=list)
    iteration_count: int = 0
    max_iterations: int = 5
    max_tool_calls: int = 10
    provider: str = "ollama"
    model: str = "medllama3:latest"
    final_response: str = ""
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    timestamps: Dict[str, str] = Field(default_factory=dict)
    is_terminal: bool = False
    stop_reason: Optional[str] = None
