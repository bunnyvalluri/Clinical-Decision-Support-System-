"""
PredictionResult domain value object.

Encapsulates the immutable output of a machine learning inference lifecycle,
including predicted risk level, probability distribution, feature snapshot,
latency metrics, and explainability attributions.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID

from django.utils import timezone


@dataclass(frozen=True)
class ExplanationResult:
    """Explainability attribution metadata for clinical staff."""
    method: str
    feature_importances: dict[str, float]
    top_risk_factors: list[dict[str, Any]]
    baseline_value: float | None = None
    features: list[dict[str, Any]] = field(default_factory=list)
    explanation_type: str = "MODEL_EXPLANATION"
    disclaimer: str = (
        "This is a MODEL EXPLANATION, not a medical diagnosis. "
        "Feature contributions represent statistical associations learned by the model "
        "and do NOT prove medical causation. "
        "Clinical decisions must be made by qualified healthcare professionals."
    )


@dataclass(frozen=True)
class PredictionResult:
    """
    Immutable domain value object representing the output of risk prediction.
    """
    patient_id: UUID | str
    risk_level: str
    probability: float
    model_name: str
    model_version: str
    model_version_id: UUID | str
    inference_latency_ms: float
    feature_snapshot: dict[str, Any]
    feature_schema_version: str = "v1.0"
    confidence_score: float | None = None
    clinical_record_id: UUID | str | None = None
    prediction_id: UUID | str | None = None
    explanation: ExplanationResult | None = None
    created_at: datetime = field(default_factory=timezone.now)

    def to_dict(self) -> dict[str, Any]:
        """Convert to JSON-serializable dictionary."""
        return {
            "prediction_id": str(self.prediction_id) if self.prediction_id else None,
            "patient_id": str(self.patient_id),
            "clinical_record_id": str(self.clinical_record_id) if self.clinical_record_id else None,
            "risk_level": self.risk_level,
            "probability": round(self.probability, 4),
            "confidence_score": round(self.confidence_score, 4) if self.confidence_score is not None else None,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "inference_latency_ms": round(self.inference_latency_ms, 2),
            "feature_schema_version": self.feature_schema_version,
            "feature_snapshot": self.feature_snapshot,
            "timestamp": self.created_at.isoformat(),
            "explanation": (
                {
                    "method": self.explanation.method,
                    "feature_importances": self.explanation.feature_importances,
                    "top_risk_factors": self.explanation.top_risk_factors,
                    "baseline_value": self.explanation.baseline_value,
                }
                if self.explanation
                else None
            ),
        }
