"""
Out-of-Distribution (OOD) Detection Module for Clinical Observations.
Measures multivariate divergence between incoming patient data and baseline training manifold
to classify inputs as IN-DISTRIBUTION, POTENTIAL DISTRIBUTION SHIFT, or OUT-OF-DISTRIBUTION.

DOCUMENTED TECHNICAL LIMITATIONS:
OOD detection relies on statistical distances in the measured feature space.
It cannot detect anomalies in unmeasured physiological covariates, novel drug interactions,
or subtle temporal dynamics not captured in the point-in-time observation vector.
"""
from dataclasses import dataclass
from enum import Enum
import math
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from ml.features.schema import NUMERICAL_FEATURES


class OODStatus(str, Enum):
    IN_DISTRIBUTION = "IN-DISTRIBUTION"
    POTENTIAL_DISTRIBUTION_SHIFT = "POTENTIAL DISTRIBUTION SHIFT"
    OUT_OF_DISTRIBUTION = "OUT-OF-DISTRIBUTION"


@dataclass
class OODResult:
    status: OODStatus
    anomaly_score: float
    max_feature_zscore: float
    divergent_features: List[Dict[str, Any]]
    details: str
    limitations: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "anomaly_score": round(self.anomaly_score, 4),
            "max_feature_zscore": round(self.max_feature_zscore, 4),
            "divergent_features": self.divergent_features,
            "details": self.details,
            "limitations": self.limitations,
        }


class OutOfDistributionDetector:
    """
    Multivariate and marginal z-score OOD detector calibrated on training cohort baselines.
    """

    LIMITATIONS_NOTICE = (
        "OOD detection is based on Euclidean/z-score distance across registered numerical parameters. "
        "It provides a statistical heuristic and does not guarantee detection of all rare clinical phenotypes."
    )

    def __init__(
        self,
        shift_threshold: float = 3.0,
        ood_threshold: float = 4.5,
        baseline_stats: Optional[Dict[str, Dict[str, float]]] = None,
    ) -> None:
        self.shift_threshold = shift_threshold
        self.ood_threshold = ood_threshold
        self.baseline_stats = baseline_stats or {}

    def fit_baseline(self, df_train: pd.DataFrame) -> None:
        """Calculate and store mean and standard deviation from clean training data."""
        self.baseline_stats = {}
        for feat in NUMERICAL_FEATURES:
            if feat in df_train.columns:
                series = pd.to_numeric(df_train[feat], errors="coerce").dropna()
                if len(series) > 1:
                    mean_val = float(series.mean())
                    std_val = float(series.std())
                    self.baseline_stats[feat] = {
                        "mean": mean_val,
                        "std": max(std_val, 1e-6),
                    }

    def evaluate_record(self, record: Dict[str, Any]) -> OODResult:
        """
        Evaluate a single incoming clinical record against the baseline distribution.
        """
        divergent: List[Dict[str, Any]] = []
        max_z = 0.0
        sum_sq_z = 0.0
        count = 0

        for feat, stats in self.baseline_stats.items():
            val = record.get(feat)
            if val is not None:
                try:
                    num_val = float(val)
                    z = abs(num_val - stats["mean"]) / stats["std"]
                    sum_sq_z += z ** 2
                    count += 1
                    if z > max_z:
                        max_z = z

                    if z >= self.shift_threshold:
                        divergent.append({
                            "feature": feat,
                            "value": num_val,
                            "baseline_mean": round(stats["mean"], 2),
                            "baseline_std": round(stats["std"], 2),
                            "z_score": round(float(z), 2),
                        })
                except (ValueError, TypeError):
                    pass

        # Normalized root-mean-square z-score
        rms_z = math.sqrt(sum_sq_z / count) if count > 0 else 0.0
        anomaly_score = float(max(rms_z, max_z * 0.7))

        if max_z >= self.ood_threshold or rms_z >= self.shift_threshold:
            status = OODStatus.OUT_OF_DISTRIBUTION
            details = (
                f"Severe distribution shift detected (max z-score {max_z:.1f}, RMS {rms_z:.1f}). "
                f"Features deviating from cohort baseline: {[d['feature'] for d in divergent]}."
            )
        elif max_z >= self.shift_threshold:
            status = OODStatus.POTENTIAL_DISTRIBUTION_SHIFT
            details = (
                f"Moderate physiological divergence detected (max z-score {max_z:.1f}). "
                f"Review parameters: {[d['feature'] for d in divergent]}."
            )
        else:
            status = OODStatus.IN_DISTRIBUTION
            details = "Patient clinical observations are well within baseline training distributions."

        return OODResult(
            status=status,
            anomaly_score=anomaly_score,
            max_feature_zscore=max_z,
            divergent_features=divergent,
            details=details,
            limitations=self.LIMITATIONS_NOTICE,
        )
