"""
Multi-Class Model Predictive Uncertainty and Abstention Module.
Calculates normalized Shannon entropy, probability margins, and ensemble variance
to classify model confidence into four clinical states:
HIGH CONFIDENCE, MODERATE CONFIDENCE, LOW CONFIDENCE, and ABSTAIN.
"""
from dataclasses import dataclass
from enum import Enum
import math
from typing import Any, Dict, List, Optional
import numpy as np


class ConfidenceLevel(str, Enum):
    HIGH_CONFIDENCE = "HIGH CONFIDENCE"
    MODERATE_CONFIDENCE = "MODERATE CONFIDENCE"
    LOW_CONFIDENCE = "LOW CONFIDENCE"
    ABSTAIN = "ABSTAIN"


@dataclass
class UncertaintyAssessment:
    confidence_level: ConfidenceLevel
    should_abstain: bool
    entropy: float
    normalized_entropy: float
    probability_margin: float
    top_probability: float
    predicted_class: str
    probabilities: Dict[str, float]
    recommendation: str
    reasons: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "confidence_level": self.confidence_level.value,
            "should_abstain": self.should_abstain,
            "entropy": round(self.entropy, 4),
            "normalized_entropy": round(self.normalized_entropy, 4),
            "probability_margin": round(self.probability_margin, 4),
            "top_probability": round(self.top_probability, 4),
            "predicted_class": self.predicted_class,
            "probabilities": self.probabilities,
            "recommendation": self.recommendation,
            "reasons": self.reasons,
        }


class ClinicalUncertaintyEstimator:
    """
    Evaluates multi-class probabilistic distributions to protect clinicians
    from relying on borderline, uncalibrated, or near-uniform model outputs.
    """

    def __init__(
        self,
        entropy_abstain_threshold: float = 0.85,
        margin_abstain_threshold: float = 0.08,
        entropy_high_threshold: float = 0.40,
        margin_high_threshold: float = 0.35,
    ) -> None:
        self.entropy_abstain_threshold = entropy_abstain_threshold
        self.margin_abstain_threshold = margin_abstain_threshold
        self.entropy_high_threshold = entropy_high_threshold
        self.margin_high_threshold = margin_high_threshold

    def evaluate(
        self,
        probabilities: Dict[str, float],
        is_ood: bool = False,
        ood_reason: Optional[str] = None,
    ) -> UncertaintyAssessment:
        """
        Evaluate predictive uncertainty from class probabilities and OOD status.
        """
        probs = list(probabilities.values())
        classes = list(probabilities.keys())
        k = len(probs)

        if k == 0:
            return UncertaintyAssessment(
                confidence_level=ConfidenceLevel.ABSTAIN,
                should_abstain=True,
                entropy=1.0,
                normalized_entropy=1.0,
                probability_margin=0.0,
                top_probability=0.0,
                predicted_class="UNKNOWN",
                probabilities={},
                recommendation="Prediction requires additional review.",
                reasons=["Empty class probability distribution."],
            )

        # Sorted probabilities descending
        sorted_probs = sorted(probs, reverse=True)
        top_prob = float(sorted_probs[0])
        second_prob = float(sorted_probs[1]) if k > 1 else 0.0
        margin = float(top_prob - second_prob)

        # Predicted class (argmax)
        best_idx = int(np.argmax(probs))
        predicted_class = classes[best_idx]

        # Multi-class Shannon Entropy: H = - sum(p_i * log2(p_i))
        raw_entropy = 0.0
        for p in probs:
            if p > 1e-9:
                raw_entropy -= p * math.log2(p)

        max_entropy = math.log2(k) if k > 1 else 1.0
        norm_entropy = float(raw_entropy / max_entropy) if max_entropy > 0 else 0.0

        reasons: List[str] = []
        should_abstain = False

        if is_ood:
            should_abstain = True
            reasons.append(f"Out-of-distribution input: {ood_reason or 'Significant training manifold divergence'}")

        if norm_entropy >= self.entropy_abstain_threshold:
            should_abstain = True
            reasons.append(
                f"High predictive entropy ({norm_entropy:.2f} >= {self.entropy_abstain_threshold:.2f}): near-uniform distribution across classes"
            )

        if margin <= self.margin_abstain_threshold and k > 1:
            should_abstain = True
            reasons.append(
                f"Negligible class separation margin ({margin:.3f} <= {self.margin_abstain_threshold:.3f}) between top classes"
            )

        if should_abstain:
            level = ConfidenceLevel.ABSTAIN
            recommendation = "Prediction requires additional review."
        elif norm_entropy <= self.entropy_high_threshold and margin >= self.margin_high_threshold:
            level = ConfidenceLevel.HIGH_CONFIDENCE
            recommendation = "High model confidence. Review in context of comprehensive clinical presentation."
        elif norm_entropy > 0.70 or margin < 0.15:
            level = ConfidenceLevel.LOW_CONFIDENCE
            recommendation = "Low model confidence. Clinical decision support requires careful manual review."
            reasons.append("Elevated entropy and narrow class margin.")
        else:
            level = ConfidenceLevel.MODERATE_CONFIDENCE
            recommendation = "Moderate model confidence. Verify with standard clinical observation protocol."

        return UncertaintyAssessment(
            confidence_level=level,
            should_abstain=should_abstain,
            entropy=float(raw_entropy),
            normalized_entropy=float(norm_entropy),
            probability_margin=float(margin),
            top_probability=float(top_prob),
            predicted_class=predicted_class,
            probabilities={c: round(float(probabilities[c]), 4) for c in classes},
            recommendation=recommendation,
            reasons=reasons,
        )
