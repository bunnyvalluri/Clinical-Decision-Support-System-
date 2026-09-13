"""
ExplanationService — OOP service for generating, persisting, and retrieving
explainable ML attributions for clinical risk predictions.

IMPORTANT: This service generates MODEL EXPLANATIONS only.
It does NOT generate medical diagnoses or claim medical causation.
"""
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

import numpy as np
import pandas as pd
from django.db import transaction
from sklearn.pipeline import Pipeline

from ml.explainability.explainer import (
    EXPLANATION_DISCLAIMER,
    compute_feature_importance_values,
    compute_shap_values,
    extract_pipeline_steps,
    get_feature_names_from_preprocessor,
    _is_tree_shap_compatible,
    _sanitize_value,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Value Objects
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class FeatureContribution:
    """Individual feature attribution in a model explanation."""
    feature: str
    value: Any
    contribution: float
    direction: str  # INCREASES_RISK | DECREASES_RISK | NEUTRAL | CONTRIBUTING
    relative_importance: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "feature": self.feature,
            "value": _sanitize_value(self.value),
            "contribution": round(self.contribution, 6),
            "direction": self.direction,
            "relative_importance": round(self.relative_importance, 6),
        }


@dataclass(frozen=True)
class ExplanationPayload:
    """Complete explanation result for a prediction."""
    explanation_type: str  # Always "MODEL_EXPLANATION"
    method: str  # "TreeSHAP" | "FeatureImportance" | "LinearCoefficients"
    predicted_class: str
    features: list[FeatureContribution]
    baseline_value: float | None
    disclaimer: str = field(default=EXPLANATION_DISCLAIMER)

    def to_dict(self) -> dict[str, Any]:
        return {
            "explanation_type": self.explanation_type,
            "method": self.method,
            "predicted_class": self.predicted_class,
            "baseline_value": _sanitize_value(self.baseline_value),
            "features": [f.to_dict() for f in self.features],
            "disclaimer": self.disclaimer,
        }


# ---------------------------------------------------------------------------
# Interfaces
# ---------------------------------------------------------------------------

class IExplainer(ABC):
    """Interface for explanation generation strategies."""

    @abstractmethod
    def explain(
        self,
        pipeline: Pipeline,
        X_transformed: np.ndarray,
        feature_names: list[str],
        raw_record: dict[str, Any],
        predicted_class: str,
        top_n: int = 10,
    ) -> ExplanationPayload:
        """Generate feature-level explanations for a single prediction."""
        pass


# ---------------------------------------------------------------------------
# Concrete Explainers
# ---------------------------------------------------------------------------

class ShapTreeExplainer(IExplainer):
    """Uses SHAP TreeExplainer for tree-based models (RandomForest, etc.)."""

    def explain(
        self,
        pipeline: Pipeline,
        X_transformed: np.ndarray,
        feature_names: list[str],
        raw_record: dict[str, Any],
        predicted_class: str,
        top_n: int = 10,
    ) -> ExplanationPayload:
        shap_values, baseline, method = compute_shap_values(
            pipeline, X_transformed, predicted_class
        )
        return self._build_payload(
            shap_values, baseline, method, feature_names, raw_record,
            predicted_class, top_n, is_shap=True,
        )

    @staticmethod
    def _build_payload(
        values: np.ndarray,
        baseline: float,
        method: str,
        feature_names: list[str],
        raw_record: dict[str, Any],
        predicted_class: str,
        top_n: int,
        is_shap: bool,
    ) -> ExplanationPayload:
        abs_total = float(np.sum(np.abs(values)))
        contributions: list[FeatureContribution] = []

        for i, feat_name in enumerate(feature_names):
            c = float(values[i])
            base_feature = feat_name.split("__")[-1]
            raw_val = raw_record.get(base_feature)

            if abs(c) < 1e-6:
                direction = "NEUTRAL"
            elif is_shap:
                direction = "INCREASES_RISK" if c > 0 else "DECREASES_RISK"
            else:
                direction = "CONTRIBUTING"

            rel_imp = abs(c) / abs_total if abs_total > 0 else 0.0

            safe_val = None
            if raw_val is not None:
                import math
                if isinstance(raw_val, float) and math.isnan(raw_val):
                    safe_val = None
                elif isinstance(raw_val, (int, float)):
                    safe_val = float(raw_val)
                else:
                    safe_val = raw_val

            contributions.append(FeatureContribution(
                feature=base_feature,
                value=safe_val,
                contribution=c,
                direction=direction,
                relative_importance=rel_imp,
            ))

        # Sort by abs contribution descending, deduplicate one-hot features
        contributions.sort(key=lambda x: abs(x.contribution), reverse=True)
        seen: set[str] = set()
        deduped: list[FeatureContribution] = []
        for fc in contributions:
            if fc.feature not in seen:
                seen.add(fc.feature)
                deduped.append(fc)

        return ExplanationPayload(
            explanation_type="MODEL_EXPLANATION",
            method=method,
            predicted_class=predicted_class,
            features=deduped[:top_n],
            baseline_value=baseline,
        )


class FeatureImportanceExplainer(IExplainer):
    """Fallback explainer using global feature importances for non-SHAP models."""

    def explain(
        self,
        pipeline: Pipeline,
        X_transformed: np.ndarray,
        feature_names: list[str],
        raw_record: dict[str, Any],
        predicted_class: str,
        top_n: int = 10,
    ) -> ExplanationPayload:
        values, baseline, method = compute_feature_importance_values(
            pipeline, feature_names
        )
        return ShapTreeExplainer._build_payload(
            values, baseline, method, feature_names, raw_record,
            predicted_class, top_n, is_shap=False,
        )


# ---------------------------------------------------------------------------
# Orchestrator Service
# ---------------------------------------------------------------------------

class ExplanationService:
    """
    Orchestrator for generating, persisting, and retrieving prediction explanations.

    Automatically selects the appropriate explanation strategy based on model type.
    """

    def __init__(self) -> None:
        self._shap_explainer = ShapTreeExplainer()
        self._fallback_explainer = FeatureImportanceExplainer()

    def _select_explainer(self, pipeline: Pipeline) -> IExplainer:
        """Choose SHAP or fallback based on classifier compatibility."""
        _, classifier = extract_pipeline_steps(pipeline)
        if _is_tree_shap_compatible(classifier):
            return self._shap_explainer
        return self._fallback_explainer

    def generate_explanation(
        self,
        pipeline: Pipeline,
        input_df: pd.DataFrame,
        raw_record: dict[str, Any],
        predicted_class: str,
        top_n: int = 10,
    ) -> ExplanationPayload:
        """
        Generate a model explanation for a single prediction.

        Args:
            pipeline: Fitted sklearn Pipeline (preprocessor + classifier).
            input_df: Pre-normalized DataFrame (feature order matching model expectations).
            raw_record: Original patient vitals/features for display values.
            predicted_class: The risk level predicted by the model.
            top_n: Max number of top features to return.

        Returns:
            ExplanationPayload with per-feature contributions and directions.
        """
        preprocessor, _ = extract_pipeline_steps(pipeline)
        feature_names = get_feature_names_from_preprocessor(pipeline)

        if preprocessor is not None:
            X_transformed = preprocessor.transform(input_df)
        else:
            X_transformed = input_df.to_numpy()

        explainer = self._select_explainer(pipeline)

        try:
            return explainer.explain(
                pipeline=pipeline,
                X_transformed=X_transformed,
                feature_names=feature_names,
                raw_record=raw_record,
                predicted_class=predicted_class,
                top_n=top_n,
            )
        except Exception as exc:
            logger.warning(
                "Primary explanation method failed (%s), trying fallback: %s",
                type(explainer).__name__, exc,
            )
            # Fall back to feature importance if SHAP crashes
            if isinstance(explainer, ShapTreeExplainer):
                return self._fallback_explainer.explain(
                    pipeline=pipeline,
                    X_transformed=X_transformed,
                    feature_names=feature_names,
                    raw_record=raw_record,
                    predicted_class=predicted_class,
                    top_n=top_n,
                )
            raise

    def get_or_generate_explanation(
        self,
        prediction_id: UUID | str,
    ) -> dict[str, Any]:
        """
        Retrieve a stored explanation for a prediction, or return None if unavailable.
        Does NOT regenerate on-demand (would require re-loading the model pipeline).
        """
        from apps.predictions.models import Prediction, PredictionExplanation

        try:
            prediction = Prediction.objects.select_related("explanation").get(id=prediction_id)
        except Prediction.DoesNotExist:
            return None

        explanation = getattr(prediction, "explanation", None)
        if explanation is None:
            return None

        return self.format_explanation_response(prediction, explanation)

    @staticmethod
    def format_explanation_response(
        prediction,
        explanation,
    ) -> dict[str, Any]:
        """
        Format a stored PredictionExplanation into the API response schema.
        """
        features_list = explanation.top_risk_factors or []

        # Ensure each feature entry has required keys
        formatted_features = []
        for f in features_list:
            formatted_features.append({
                "feature": f.get("feature", "unknown"),
                "value": _sanitize_value(f.get("value")),
                "contribution": round(float(f.get("contribution", 0.0)), 6),
                "direction": f.get("direction", "CONTRIBUTING"),
                "relative_importance": round(float(f.get("relative_importance", 0.0)), 6),
            })

        return {
            "prediction_id": str(prediction.id),
            "risk_level": prediction.prediction_result,
            "probability": round(float(prediction.probability), 4),
            "explanation_type": "MODEL_EXPLANATION",
            "method": explanation.method,
            "baseline_value": _sanitize_value(explanation.baseline_value),
            "features": formatted_features,
            "disclaimer": EXPLANATION_DISCLAIMER,
        }
