"""
MLOps Drift Detection and Retraining Governance.
Monitors feature drift using Population Stability Index (PSI) and
Kolmogorov-Smirnov (KS) tests. Governs controlled retraining pipelines.
"""
from dataclasses import dataclass
import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


@dataclass
class DriftEvaluationResult:
    feature_name: str
    psi: float
    ks_statistic: float
    p_value: float
    drift_severity: str  # STABLE, MODERATE, SEVERE
    alert_triggered: bool
    interpretation: str


class FeatureDriftDetector:
    """
    Computes statistical divergence between baseline training distributions
    and active production inference distributions.
    """

    def __init__(
        self,
        psi_moderate_threshold: float = 0.10,
        psi_severe_threshold: float = 0.25,
        num_bins: int = 10,
    ) -> None:
        self.psi_moderate_threshold = psi_moderate_threshold
        self.psi_severe_threshold = psi_severe_threshold
        self.num_bins = num_bins

    def calculate_psi(
        self, expected: np.ndarray, actual: np.ndarray
    ) -> float:
        """
        Calculate Population Stability Index (PSI) across quantile bins.
        """
        expected = np.asarray(expected, dtype=float)
        actual = np.asarray(actual, dtype=float)

        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        # Create quantile bins based on reference/expected dataset
        quantiles = np.linspace(0, 100, self.num_bins + 1)
        bins = np.percentile(expected, quantiles)
        bins[0] = -np.inf
        bins[-1] = np.inf

        # Calculate counts per bin
        expected_counts, _ = np.histogram(expected, bins=bins)
        actual_counts, _ = np.histogram(actual, bins=bins)

        # Convert to percentages with epsilon smoothing to prevent div by zero
        eps = 1e-4
        expected_pct = (expected_counts + eps) / (len(expected) + eps * self.num_bins)
        actual_pct = (actual_counts + eps) / (len(actual) + eps * self.num_bins)

        # PSI = sum((actual% - expected%) * ln(actual% / expected%))
        psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(max(0.0, psi_val))

    def calculate_ks_test(
        self, expected: np.ndarray, actual: np.ndarray
    ) -> Tuple[float, float]:
        """
        Two-sample Kolmogorov-Smirnov test to detect distribution difference.
        """
        try:
            from scipy import stats
            res = stats.ks_2samp(expected, actual)
            return float(res.statistic), float(res.pvalue)
        except Exception:
            # Fallback empirical KS statistic without scipy
            data1 = np.sort(expected)
            data2 = np.sort(actual)
            n1 = len(data1)
            n2 = len(data2)
            data_all = np.concatenate([data1, data2])
            cdf1 = np.searchsorted(data1, data_all, side="right") / n1
            cdf2 = np.searchsorted(data2, data_all, side="right") / n2
            d = float(np.max(np.abs(cdf1 - cdf2)))
            # Approximate p-value
            en = np.sqrt(n1 * n2 / (n1 + n2))
            p_val = max(0.001, min(1.0, 2.0 * np.exp(-2.0 * (en * d) ** 2)))
            return d, p_val

    def evaluate_feature(
        self, feature_name: str, baseline_samples: List[float], production_samples: List[float]
    ) -> DriftEvaluationResult:
        """
        Evaluate full drift profile for a single continuous clinical variable.
        """
        exp = np.array(baseline_samples, dtype=float)
        act = np.array(production_samples, dtype=float)

        psi = self.calculate_psi(exp, act)
        ks_stat, p_val = self.calculate_ks_test(exp, act)

        if psi >= self.psi_severe_threshold:
            severity = "SEVERE"
            alert = True
            interp = (
                f"Severe population shift detected in {feature_name} (PSI={psi:.3f} >= {self.psi_severe_threshold}). "
                f"Model reliability is compromised. Clinical review and retraining evaluation required."
            )
        elif psi >= self.psi_moderate_threshold:
            severity = "MODERATE"
            alert = False
            interp = (
                f"Moderate feature drift in {feature_name} (PSI={psi:.3f}). Increased monitoring recommended."
            )
        else:
            severity = "STABLE"
            alert = False
            interp = f"Feature distribution for {feature_name} is stable (PSI={psi:.3f} < {self.psi_moderate_threshold})."

        return DriftEvaluationResult(
            feature_name=feature_name,
            psi=psi,
            ks_statistic=ks_stat,
            p_value=p_val,
            drift_severity=severity,
            alert_triggered=alert,
            interpretation=interp,
        )


class RetrainingGovernor:
    """
    Governs the model retraining workflow.
    Ensures that candidate models are validated on held-out benchmark splits
    and strictly forbids automated deployment without human clinical administrative sign-off.
    """

    @staticmethod
    def evaluate_candidate_promotion(
        active_metrics: Dict[str, float], candidate_metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Compare active production model vs newly trained candidate across metrics.
        Requires false-negative minimization in clinical risk models.
        """
        active_auc = active_metrics.get("roc_auc", 0.0)
        cand_auc = candidate_metrics.get("roc_auc", 0.0)
        active_recall = active_metrics.get("recall", 0.0)
        cand_recall = candidate_metrics.get("recall", 0.0)

        # Clinical rule: Candidate must not degrade recall (false negatives are dangerous)
        meets_criteria = (cand_auc >= active_auc) and (cand_recall >= active_recall * 0.98)

        return {
            "status": "APPROVED_FOR_REVIEW" if meets_criteria else "REJECTED_BY_GOVERNANCE",
            "candidate_roc_auc": cand_auc,
            "active_roc_auc": active_auc,
            "candidate_recall": cand_recall,
            "active_recall": active_recall,
            "requires_human_signoff": True,
            "auto_deployed": False,
            "message": (
                "Candidate model meets promotion benchmark. Awaiting administrative clinical sign-off."
                if meets_criteria
                else "Candidate model did not outperform production baseline or increased false negative rate."
            ),
        }
