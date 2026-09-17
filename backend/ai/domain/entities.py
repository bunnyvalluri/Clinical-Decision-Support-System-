"""
AI Domain Entities & Value Objects for Clinical Decision Support.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid


class ActionLevel(str, Enum):
    LEVEL_0 = "LEVEL_0"  # Read-only informational
    LEVEL_1 = "LEVEL_1"  # Analysis & aggregation
    LEVEL_2 = "LEVEL_2"  # Draft preparation
    LEVEL_3 = "LEVEL_3"  # Human-approved action
    LEVEL_4 = "LEVEL_4"  # Restricted admin action
    LEVEL_5 = "LEVEL_5"  # Forbidden autonomous clinical action


class GroundingStatus(str, Enum):
    GROUNDED = "GROUNDED"
    PARTIALLY_GROUNDED = "PARTIALLY_GROUNDED"
    UNSUPPORTED = "UNSUPPORTED"
    ERROR = "ERROR"


class SensitivityTier(str, Enum):
    PUBLIC = "PUBLIC"
    LOW_SENSITIVITY = "LOW_SENSITIVITY"
    SENSITIVE = "SENSITIVE"
    PHI = "PHI"
    HIGHLY_SENSITIVE = "HIGHLY_SENSITIVE"
    SECRET = "SECRET"
    UNKNOWN = "UNKNOWN"


@dataclass
class Citation:
    guideline_id: str
    title: str
    section: str
    recommendation: str
    evidence_level: str = "Guideline Consensus"
    doi_or_url: Optional[str] = None
    retrieval_timestamp: Optional[str] = None


@dataclass
class ToolCallRequest:
    tool_name: str
    arguments: Dict[str, Any]
    call_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    idempotency_key: Optional[str] = None


@dataclass
class ToolCallResult:
    call_id: str
    tool_name: str
    success: bool
    result_data: Dict[str, Any]
    error_message: Optional[str] = None
    latency_ms: float = 0.0


@dataclass
class AIRequestEnvelope:
    user_id: str
    user_role: str
    query: str
    correlation_id: str
    conversation_id: Optional[str] = None
    patient_id: Optional[str] = None
    model_override: Optional[str] = None
    temperature: float = 0.1
    max_tokens: int = 2048
    requires_streaming: bool = False
    context_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AIResponseEnvelope:
    content: str
    model_name: str
    provider: str
    citations: List[Citation] = field(default_factory=list)
    grounding_status: GroundingStatus = GroundingStatus.GROUNDED
    grounding_confidence: float = 1.0
    tool_executions: List[ToolCallResult] = field(default_factory=list)
    requires_human_approval: bool = False
    approval_details: Optional[Dict[str, Any]] = None
    safety_flags: List[str] = field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0
    estimated_cost_usd: float = 0.0
    latency_ms: float = 0.0
    is_error: bool = False
    error_code: Optional[str] = None
