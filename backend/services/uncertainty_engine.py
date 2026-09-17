"""
Model Uncertainty and Out-of-Distribution (OOD) Detector.
Quantifies predictive uncertainty using Shannon entropy, ensemble variance,
and feature-space manifold distance to support automated clinical abstention.
"""
import math
from typing import Any, Dict, List, Optional
import numpy as np

from services.base import BaseService
from services.interfaces import IUncertaintyDetector, UncertaintyResult


# Clinically established training reference distributions for baseline distance checks
TRAINING_REFERENCE_RANGES: Dict[str, Dict[str, float]] = {
    "age": {"mean": 61.2, "std": 14.5, "min": 18.0, "max": 105.0},
    "heart_rate": {"mean": 78.4, "std": 16.8, "min": 30.0, "max": 220.0},
    "systolic_bp": {"mean": 128.5, "std": 22.4, "min": 50.0, "max": 260.0},
    "diastolic_bp": {"mean": 79.8, "std": 13.6, "min": 30.0, "max": 160.0},
    "respiratory_rate": {"mean": 17.6, "std": 4.8, "min": 6.0, "max": 60.0},
    "temperature": {"mean": 37.0, "std": 0.8, "min": 32.0, "max": 43.0},
    "oxygen_saturation": {"mean": 96.8, "std": 2.9, "min": 60.0, "max": 100.0},
    "glucose": {"mean": 115.4, "std": 42.0, "min": 20.0, "max": 800.0},
    "creatinine": {"mean": 1.15, "std": 0.72, "min": 0.2, "max": 15.0},
    "potassium": {"mean": 4.15, "std": 0.55, "min": 1.5, "max": 9.0},
    "sodium": {"mean": 139.2, "std": 4.3, "min": 105.0, "max": 175.0},
    "lactic_acid": {"mean": 1.45, "std": 0.85, "min": 0.3, "max": 20.0},
}


class UncertaintyEngine(BaseService, IUncertaintyDetector):
    """
    Evaluates predictive uncertainty and training manifold divergence.
    When uncertainty is high, enforces clinical abstention.
    """

    def __init__(
        self,
        entropy_abstain_threshold: float = 0.90,
        variance_abstain_threshold: float = 0.08,
        ood_distance_threshold: float = 4.0,
    ) -> None:
        super().__init__()
        self.entropy_abstain_threshold = entropy_abstain_threshold
        self.variance_abstain_threshold = variance_abstain_threshold
        self.ood_distance_threshold = ood_distance_threshold

    def evaluate_uncertainty(
        self, features: Dict[str, float], ensemble_predictions: List[float]
    ) -> UncertaintyResult:
        """
        Evaluate uncertainty across model ensemble and input feature space.
        """
        if not ensemble_predictions:
            ensemble_predictions = [0.5]

        preds = np.array(ensemble_predictions, dtype=float)
        mean_prob = float(np.mean(preds))
        variance = float(np.var(preds)) if len(preds) > 1 else 0.0

        # Calculate binary Shannon entropy: - (p * log2(p) + (1-p) * log2(1-p))
        entropy = self._calculate_shannon_entropy(mean_prob)

        # Confidence margin from decision boundary (0.5)
        # 0.5 -> 0% confidence, 1.0 or 0.0 -> 100% confidence
        confidence_score = float(2.0 * abs(mean_prob - 0.5))

        # Check Out-of-Distribution (OOD) distance
        is_ood, ood_dist = self._evaluate_ood_distance(features)

        # Determine abstention condition
        should_abstain = False
        reasons = []

        if entropy >= self.entropy_abstain_threshold:
            should_abstain = True
            reasons.append(f"High predictive entropy ({entropy:.3f} >= {self.entropy_abstain_threshold})")

        if variance >= self.variance_abstain_threshold:
            should_abstain = True
            reasons.append(f"High inter-model ensemble disagreement (variance {variance:.4f})")

        if is_ood:
            should_abstain = True
            reasons.append(f"Out-of-distribution clinical physiology detected (z-score {ood_dist:.2f})")

        if should_abstain:
            recommendation = (
                f"[ABSTAIN RECOMMENDED] Prediction requires additional review. Model confidence is insufficient for an automated risk assessment "
                f"({'; '.join(reasons)}). Immediate clinical review is recommended."
            )
        else:
            recommendation = (
                f"Model evaluation confidence is adequate ({confidence_score * 100:.1f}%). "
                f"Recommendation should be reviewed in context of patient's total clinical presentation."
            )

        return UncertaintyResult(
            probability=mean_prob,
            confidence_score=confidence_score,
            entropy=entropy,
            ensemble_variance=variance,
            is_out_of_distribution=is_ood,
            ood_distance=ood_dist,
            should_abstain=should_abstain,
            clinical_recommendation=recommendation,
        )

    def _calculate_shannon_entropy(self, p: float) -> float:
        """Compute binary Shannon entropy bounded [0.0, 1.0]."""
        p = max(1e-7, min(1.0 - 1e-7, p))
        return float(-(p * math.log2(p) + (1.0 - p) * math.log2(1.0 - p)))

    def _evaluate_ood_distance(self, features: Dict[str, float]) -> tuple[bool, float]:
        """
        Calculates standardized distance against the reference training population.
        """
        squared_distances = []
        extreme_violations = 0

        for feat_name, val in features.items():
            if val is None:
                continue
            norm_name = feat_name.lower().replace(" ", "_")
            if norm_name in TRAINING_REFERENCE_RANGES:
                ref = TRAINING_REFERENCE_RANGES[norm_name]
                val_float = float(val)

                # Hard biological boundary violation
                if val_float < ref["min"] or val_float > ref["max"]:
                    extreme_violations += 1

                # Standardized z-score
                z = (val_float - ref["mean"]) / max(ref["std"], 1e-5)
                squared_distances.append(z ** 2)

        if not squared_distances:
            return False, 0.0

        # Root Mean Square z-score across clinical dimensions
        rms_dist = float(math.sqrt(np.mean(squared_distances)))
        is_ood = (rms_dist >= self.ood_distance_threshold) or (extreme_violations > 0)

        return is_ood, rms_dist
