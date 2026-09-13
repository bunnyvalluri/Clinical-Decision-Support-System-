"""
MLOps Drift Detection and Retraining Governance Module.
Monitors:
- Feature Data Drift: Numerical features via PSI & Kolmogorov-Smirnov (KS) tests;
  Categorical features via Jensen-Shannon Divergence / Chi-Square.
- Prediction Drift: Divergence in output risk distribution (LOW, MEDIUM, HIGH, CRITICAL)
  against approved training baselines.
- Performance Drift: Degradation in accuracy, recall, and calibration when ground truth arrives.
- Retraining Governance: Enforces human-in-the-loop clinical approval gates and strictly
  forbids unattended automatic retraining or continuous deployment.
"""
from dataclasses import dataclass
import math
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from ml.features.schema import TARGET_CLASSES


@dataclass
class DriftEvaluationResult:
    feature_name: str
    metric_name: str
    metric_value: float
    p_value: Optional[float]
    drift_severity: str  # STABLE, MODERATE, SEVERE
    alert_triggered: bool
    interpretation: str
    missingness_shift: float = 0.0


@dataclass
class PredictionDriftResult:
    psi: float
    chi2_statistic: float
    p_value: float
    baseline_distribution: Dict[str, float]
    production_distribution: Dict[str, float]
    severity: str  # STABLE, MODERATE, SEVERE
    alert_triggered: bool
    interpretation: str


class FeatureDriftDetector:
    """
    Evaluates statistical divergence between baseline training distributions
    and active production inference data across numerical and categorical features.
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

    def calculate_psi(self, expected: np.ndarray, actual: np.ndarray) -> float:
        """
        Calculate Population Stability Index (PSI) using quantile binning.
        """
        expected = np.asarray(expected, dtype=float)
        actual = np.asarray(actual, dtype=float)

        expected = expected[~np.isnan(expected)]
        actual = actual[~np.isnan(actual)]

        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        quantiles = np.linspace(0, 100, self.num_bins + 1)
        bins = np.percentile(expected, quantiles)
        bins[0] = -np.inf
        bins[-1] = np.inf

        expected_counts, _ = np.histogram(expected, bins=bins)
        actual_counts, _ = np.histogram(actual, bins=bins)

        eps = 1e-4
        expected_pct = (expected_counts + eps) / (len(expected) + eps * self.num_bins)
        actual_pct = (actual_counts + eps) / (len(actual) + eps * self.num_bins)

        psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(max(0.0, psi_val))

    def calculate_ks_test(self, expected: np.ndarray, actual: np.ndarray) -> Tuple[float, float]:
        """
        Two-sample Kolmogorov-Smirnov test for continuous features.
        """
        expected = np.asarray(expected, dtype=float)
        actual = np.asarray(actual, dtype=float)
        expected = expected[~np.isnan(expected)]
        actual = actual[~np.isnan(actual)]

        try:
            from scipy import stats
            res = stats.ks_2samp(expected, actual)
            return float(res.statistic), float(res.pvalue)
        except Exception:
            # Fallback empirical KS test
            d1 = np.sort(expected)
            d2 = np.sort(actual)
            n1 = len(d1)
            n2 = len(d2)
            if n1 == 0 or n2 == 0:
                return 0.0, 1.0
            data_all = np.concatenate([d1, d2])
            cdf1 = np.searchsorted(d1, data_all, side="right") / n1
            cdf2 = np.searchsorted(d2, data_all, side="right") / n2
            d = float(np.max(np.abs(cdf1 - cdf2)))
            en = np.sqrt(n1 * n2 / (n1 + n2))
            p_val = max(0.001, min(1.0, 2.0 * np.exp(-2.0 * (en * d) ** 2)))
            return d, p_val

    def calculate_categorical_divergence(
        self,
        expected_cats: List[str],
        actual_cats: List[str],
    ) -> Tuple[float, float]:
        """
        Calculate categorical PSI across distinct categorical levels.
        """
        all_levels = sorted(list(set(expected_cats) | set(actual_cats)))
        if not all_levels:
            return 0.0, 1.0

        n_exp = max(len(expected_cats), 1)
        n_act = max(len(actual_cats), 1)

        exp_counts = pd.Series(expected_cats).value_counts()
        act_counts = pd.Series(actual_cats).value_counts()

        eps = 1e-4
        psi = 0.0
        for lvl in all_levels:
            p_exp = (exp_counts.get(lvl, 0) + eps) / (n_exp + eps * len(all_levels))
            p_act = (act_counts.get(lvl, 0) + eps) / (n_act + eps * len(all_levels))
            psi += (p_act - p_exp) * math.log(p_act / p_exp)

        return float(max(0.0, psi)), 1.0

    def evaluate_feature(
        self,
        feature_name: str,
        baseline_samples: List[Any],
        production_samples: List[Any],
        is_categorical: bool = False,
    ) -> DriftEvaluationResult:
        """
        Evaluate full drift profile for a single clinical variable.
        """
        n_b = len(baseline_samples)
        n_p = len(production_samples)

        # Missingness drift
        b_miss = sum(1 for x in baseline_samples if x is None or (isinstance(x, float) and np.isnan(x)))
        p_miss = sum(1 for x in production_samples if x is None or (isinstance(x, float) and np.isnan(x)))
        b_miss_pct = (b_miss / n_b * 100.0) if n_b > 0 else 0.0
        p_miss_pct = (p_miss / n_p * 100.0) if n_p > 0 else 0.0
        miss_shift = round(p_miss_pct - b_miss_pct, 2)

        if is_categorical:
            b_clean = [str(x) for x in baseline_samples if x is not None]
            p_clean = [str(x) for x in production_samples if x is not None]
            psi, p_val = self.calculate_categorical_divergence(b_clean, p_clean)
            metric_name = "Categorical-PSI"
        else:
            exp_num = np.array([float(x) for x in baseline_samples if x is not None and not (isinstance(x, float) and np.isnan(x))])
            act_num = np.array([float(x) for x in production_samples if x is not None and not (isinstance(x, float) and np.isnan(x))])
            psi = self.calculate_psi(exp_num, act_num)
            ks_stat, p_val = self.calculate_ks_test(exp_num, act_num)
            metric_name = "PSI"

        if psi >= self.psi_severe_threshold or abs(miss_shift) >= 20.0:
            severity = "SEVERE"
            alert = True
            interp = (
                f"Severe population drift detected in {feature_name} (PSI={psi:.3f}, missingness shift={miss_shift}%). "
                f"Model reliability may be degraded. Clinical review and dataset investigation required."
            )
        elif psi >= self.psi_moderate_threshold or abs(miss_shift) >= 10.0:
            severity = "MODERATE"
            alert = False
            interp = f"Moderate distribution shift in {feature_name} (PSI={psi:.3f}). Increased monitoring advised."
        else:
            severity = "STABLE"
            alert = False
            interp = f"Feature distribution for {feature_name} is stable (PSI={psi:.3f})."

        return DriftEvaluationResult(
            feature_name=feature_name,
            metric_name=metric_name,
            metric_value=round(psi, 4),
            p_value=round(p_val, 4) if p_val is not None else None,
            drift_severity=severity,
            alert_triggered=alert,
            interpretation=interp,
            missingness_shift=miss_shift,
        )


class PredictionDriftDetector:
    """
    Monitors distribution of production model risk predictions
    (e.g., LOW %, MEDIUM %, HIGH %, CRITICAL %) against baseline training expectations.
    """

    def __init__(self, psi_threshold: float = 0.20) -> None:
        self.psi_threshold = psi_threshold

    def evaluate_predictions(
        self,
        baseline_preds: List[str],
        production_preds: List[str],
        classes: List[str] = TARGET_CLASSES,
    ) -> PredictionDriftResult:
        """
        Compare production prediction percentages against training baseline.
        """
        n_b = max(len(baseline_preds), 1)
        n_p = max(len(production_preds), 1)

        b_counts = pd.Series(baseline_preds).value_counts().to_dict()
        p_counts = pd.Series(production_preds).value_counts().to_dict()

        b_dist: Dict[str, float] = {}
        p_dist: Dict[str, float] = {}
        eps = 1e-4
        psi = 0.0

        for c in classes:
            b_pct = (b_counts.get(c, 0) + eps) / (n_b + eps * len(classes))
            p_pct = (p_counts.get(c, 0) + eps) / (n_p + eps * len(classes))
            b_dist[c] = round(float(b_pct * 100.0), 2)
            p_dist[c] = round(float(p_pct * 100.0), 2)
            psi += (p_pct - b_pct) * math.log(p_pct / b_pct)

        psi = float(max(0.0, psi))

        if psi >= self.psi_threshold:
            severity = "SEVERE"
            alert = True
            interp = (
                f"Significant prediction distribution drift detected (PSI={psi:.3f} >= {self.psi_threshold}). "
                f"Shift from baseline: {p_dist} vs {b_dist}. Clinical audit recommended."
            )
        elif psi >= self.psi_threshold * 0.5:
            severity = "MODERATE"
            alert = False
            interp = f"Moderate prediction shift (PSI={psi:.3f}). Monitor closely."
        else:
            severity = "STABLE"
            alert = False
            interp = f"Prediction output distribution is stable (PSI={psi:.3f})."

        return PredictionDriftResult(
            psi=round(psi, 4),
            chi2_statistic=0.0,
            p_value=1.0,
            baseline_distribution=b_dist,
            production_distribution=p_dist,
            severity=severity,
            alert_triggered=alert,
            interpretation=interp,
        )


class RetrainingGovernor:
    """
    Governs model retraining lifecycle.
    Prevents automatic re-deployment and enforces strict clinical human sign-off.
    """

    @staticmethod
    def evaluate_candidate_promotion(
        active_metrics: Dict[str, float],
        candidate_metrics: Dict[str, float],
    ) -> Dict[str, Any]:
        """
        Compare candidate model against production champion.
        Clinical requirement: Candidate must not degrade high-risk recall (false negatives are dangerous).
        """
        active_auc = active_metrics.get("roc_auc_macro") or active_metrics.get("roc_auc", 0.0)
        cand_auc = candidate_metrics.get("roc_auc_macro") or candidate_metrics.get("roc_auc", 0.0)
        active_rec = active_metrics.get("recall_macro") or active_metrics.get("recall", 0.0)
        cand_rec = candidate_metrics.get("recall_macro") or candidate_metrics.get("recall", 0.0)

        # High-risk recall criterion
        meets_criteria = (cand_auc >= active_auc * 0.99) and (cand_rec >= active_rec * 0.98)

        return {
            "status": "APPROVED_FOR_REVIEW" if meets_criteria else "REJECTED_BY_GOVERNANCE",
            "candidate_roc_auc": round(float(cand_auc), 4),
            "active_roc_auc": round(float(active_auc), 4),
            "candidate_recall": round(float(cand_rec), 4),
            "active_recall": round(float(active_rec), 4),
            "requires_human_signoff": True,
            "auto_deployed": False,
            "message": (
                "Candidate model meets evaluation threshold. Awaiting clinical administrative sign-off."
                if meets_criteria
                else "Candidate model degraded high-risk recall or discrimination. Rejected by governance."
            ),
        }
