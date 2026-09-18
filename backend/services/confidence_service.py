"""
Prediction Confidence & Abstention Service — BPY-CSE-2666.
Evaluates multi-class probabilistic distributions, entropy, and margin to protect clinicians
from relying on uncalibrated, near-uniform, or high-uncertainty model outputs.
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import numpy as np

from ml.inference.uncertainty import ClinicalUncertaintyEstimator, ConfidenceLevel, UncertaintyAssessment


class PredictionConfidenceService:
    """
    Evaluates confidence, predictive entropy, and abstention recommendations.
    If uncertainty exceeds thresholds, the system flags the prediction as REVIEW_REQUIRED
    instead of forcing an unreliable diagnosis.
    """

    def __init__(
        self,
        entropy_abstain_threshold: float = 0.85,
        margin_abstain_threshold: float = 0.08,
    ) -> None:
        self.estimator = ClinicalUncertaintyEstimator(
            entropy_abstain_threshold=entropy_abstain_threshold,
            margin_abstain_threshold=margin_abstain_threshold,
        )

    def evaluate(
        self,
        probabilities: Dict[str, float],
        is_ood: bool = False,
        ood_reason: Optional[str] = None,
    ) -> UncertaintyAssessment:
        """
        Evaluate probabilities and OOD state to return uncertainty assessment.
        """
        return self.estimator.evaluate(
            probabilities=probabilities,
            is_ood=is_ood,
            ood_reason=ood_reason,
        )
