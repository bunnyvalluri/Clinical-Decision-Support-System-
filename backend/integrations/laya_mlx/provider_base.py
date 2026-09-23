"""
Abstract Base Provider for Typed-Decision AI Engines.
Decouples HealthNova clinical workflows from specific inference implementations.
"""
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DecisionType(str, Enum):
    CHOICE = "CHOICE"
    SCORE = "SCORE"
    BOOLEAN = "BOOLEAN"


class UncertaintyStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    CONFLICTING_DATA = "CONFLICTING_DATA"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    REQUIRES_CLINICIAN_REVIEW = "REQUIRES_CLINICIAN_REVIEW"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"



class TypedDecisionOutput(BaseModel):
    """
    Standardized typed decision inference output.
    """
    model_config = {"protected_namespaces": ()}

    decision_type: str
    result_value: Any
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: Dict[str, float] = Field(default_factory=dict)
    uncertainty_status: str
    requires_human_review: bool = False
    latency_ms: float = 0.0
    model_identifier: str = ""
    model_revision: str = ""
    provider_name: str = "laya-mlx"
    action_probability: Optional[float] = None
    audit_metadata: Dict[str, Any] = Field(default_factory=dict)


class TypedDecisionProvider(ABC):
    """
    Abstract interface for typed decision AI providers.
    All providers must implement choice, score, and boolean prediction alongside health diagnostics.
    """
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def predict_choice(
        self,
        case_context: str,
        instructions: str,
        options: List[str],
        schema_version: str = "1.0",
        correlation_id: Optional[str] = None,
    ) -> TypedDecisionOutput:
        """Predict a categorical choice among approved options."""
        pass

    @abstractmethod
    def predict_score(
        self,
        case_context: str,
        instructions: str,
        criteria: List[str],
        schema_version: str = "1.0",
        correlation_id: Optional[str] = None,
    ) -> TypedDecisionOutput:
        """Predict a structured workflow urgency score with associated criteria legend."""
        pass

    @abstractmethod
    def predict_boolean(
        self,
        case_context: str,
        instructions: str,
        schema_version: str = "1.0",
        correlation_id: Optional[str] = None,
    ) -> TypedDecisionOutput:
        """Predict a boolean decision (e.g., additional information required)."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Perform provider health check."""
        pass

    @abstractmethod
    def model_info(self) -> Dict[str, Any]:
        """Return metadata about current model checkpoint and runtime."""
        pass

    @abstractmethod
    def capabilities(self) -> Dict[str, Any]:
        """Return platform capability and device support matrix."""
        pass

    @abstractmethod
    def validate_configuration(self) -> bool:
        """Validate configuration settings and credentials."""
        pass
