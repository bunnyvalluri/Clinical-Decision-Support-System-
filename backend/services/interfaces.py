"""
Modular, AGI-Ready interfaces decoupling domain logic from AI backends,
model providers, knowledge retrieval systems, and safety guardrails.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid


@dataclass(frozen=True)
class ToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]
    required_role: str
    timeout_seconds: int = 10


@dataclass
class ToolExecutionResult:
    tool_name: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    latency_ms: float = 0.0
    audit_event_id: Optional[str] = None


@dataclass
class GuardrailResult:
    is_safe: bool
    reason: Optional[str] = None
    sanitized_input: Optional[str] = None
    flags: List[str] = field(default_factory=list)
    confidence: float = 1.0


@dataclass
class KnowledgeCitation:
    guideline_id: str
    title: str
    organization: str
    section: str
    recommendation: str
    evidence_level: str
    doi_or_url: Optional[str] = None


@dataclass
class KnowledgeRetrievalResult:
    query: str
    citations: List[KnowledgeCitation]
    relevance_scores: List[float]
    grounding_confidence: float


@dataclass
class UncertaintyResult:
    probability: float
    confidence_score: float
    entropy: float
    ensemble_variance: float
    is_out_of_distribution: bool
    ood_distance: float
    should_abstain: bool
    clinical_recommendation: str


@dataclass
class DeterministicRuleAlert:
    rule_name: str
    severity: str  # NORMAL, MONITOR, URGENT_EVALUATION, CRITICAL_EMERGENCY
    trigger_criteria: str
    recommended_action: str
    rule_id: str = ""
    rule_version: str = "1.0.0"
    evidence_source: str = ""
    explanation: str = ""
    evaluated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class IAIProvider(ABC):
    """Abstract generative/assistant AI provider interface (e.g. OpenAI, Anthropic, Neon AI Gateway, Mock)."""

    @abstractmethod
    def generate_completion(
        self,
        system_prompt: str,
        user_message: str,
        tools: Optional[List[ToolDefinition]] = None,
        max_tokens: int = 1024,
        temperature: float = 0.0,
    ) -> Dict[str, Any]:
        """Generate a deterministic completion with strict token and tool boundaries."""
        pass


class ISafetyGuardrail(ABC):
    """Abstract safety guardrail interface."""

    @abstractmethod
    def validate_input(self, text: str, user_role: str) -> GuardrailResult:
        """Validate input for prompt injection, jailbreaks, and medical authority usurpation."""
        pass

    @abstractmethod
    def validate_output(self, output: str) -> GuardrailResult:
        """Validate output to prevent autonomous diagnosis, prescriptions, or discharge orders."""
        pass


class IKnowledgeProvider(ABC):
    """Abstract clinical knowledge retrieval interface."""

    @abstractmethod
    def retrieve(
        self, query: str, clinical_context: Optional[Dict[str, Any]] = None, top_k: int = 3
    ) -> KnowledgeRetrievalResult:
        """Retrieve approved clinical guidelines matching query."""
        pass


class IClinicalRuleEngine(ABC):
    """Abstract deterministic clinical rule engine."""

    @abstractmethod
    def evaluate(self, clinical_data: Dict[str, Any]) -> List[DeterministicRuleAlert]:
        """Evaluate deterministic clinical protocols (qSOFA, NEWS2, critical thresholds)."""
        pass


class IUncertaintyDetector(ABC):
    """Abstract model uncertainty and out-of-distribution detector."""

    @abstractmethod
    def evaluate_uncertainty(
        self, features: Dict[str, float], ensemble_predictions: List[float]
    ) -> UncertaintyResult:
        """Evaluate ensemble variance, entropy, and OOD Mahalanobis distance."""
        pass


class IToolRegistry(ABC):
    """Abstract tool registry for agentic tool execution."""

    @abstractmethod
    def get_available_tools(self, user_role: str) -> List[ToolDefinition]:
        pass

    @abstractmethod
    def execute_tool(
        self, tool_name: str, parameters: Dict[str, Any], user_context: Dict[str, Any]
    ) -> ToolExecutionResult:
        pass
