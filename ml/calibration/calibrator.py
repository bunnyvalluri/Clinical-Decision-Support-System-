"""
Clinical Probability Calibration and Reliability Module.
Evaluates classifier reliability diagrams, multi-class Brier scores, and fits
probability calibrators (Platt scaling / Sigmoid and Isotonic regression)
to guarantee that model probabilities reflect empirical event rates.

IMPORTANT CLINICAL TERMINOLOGY:
Model outputs are explicitly denoted as "PREDICTED PROBABILITIES",
never as "clinical certainty" or "diagnostic ground truth".
"""
import logging
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import label_binarize

from ml.features.schema import TARGET_CLASSES

logger = logging.getLogger(__name__)


def compute_multiclass_brier_score(
    y_true: Union[pd.Series, np.ndarray, List[str]],
    y_proba: np.ndarray,
    classes: List[str] = TARGET_CLASSES,
) -> float:
    """
    Compute overall multi-class Brier score:
    BS = (1 / N) * sum_{i=1}^N sum_{k=1}^K (p_{ik} - y_{ik})^2
    Lower is better (0.0 = perfect probabilistic calibration).
    """
    y_true_arr = np.array(y_true)
    y_bin = label_binarize(y_true_arr, classes=classes)
    if y_bin.shape[1] == 1 and len(classes) == 2:
        y_bin = np.hstack([1 - y_bin, y_bin])

    squared_diff = (y_proba - y_bin) ** 2
    return float(np.mean(np.sum(squared_diff, axis=1)))


def evaluate_calibration(
    pipeline: Pipeline,
    X_val: pd.DataFrame,
    y_val: Union[pd.Series, np.ndarray],
    target_classes: List[str] = TARGET_CLASSES,
    n_bins: int = 5,
) -> Dict[str, Any]:
    """
    Evaluate probabilistic calibration quality across classes using reliability curve
    and multi-class Brier score on held-out validation data.
    """
    if not hasattr(pipeline, "predict_proba"):
        return {
            "is_calibrated": False,
            "brier_score": None,
            "curves": {},
            "status": "NOT_AVAILABLE",
            "message": "Estimator does not support probability prediction.",
        }

    y_proba = pipeline.predict_proba(X_val)
    pipeline_classes = list(getattr(pipeline, "classes_", target_classes))
    y_val_arr = np.array(y_val)
    y_bin = label_binarize(y_val_arr, classes=pipeline_classes)

    overall_brier = compute_multiclass_brier_score(y_val_arr, y_proba, classes=pipeline_classes)

    curves: Dict[str, Any] = {}
    class_briers: Dict[str, float] = {}

    for idx, cls in enumerate(pipeline_classes):
        y_bin_cls = y_bin[:, idx]
        proba_cls = y_proba[:, idx]

        if len(np.unique(y_bin_cls)) > 1:
            fraction_pos, mean_pred = calibration_curve(
                y_bin_cls, proba_cls, n_bins=n_bins, strategy="uniform"
            )
            cls_brier = float(brier_score_loss(y_bin_cls, proba_cls))
            curves[str(cls)] = {
                "mean_predicted_probability": [round(float(p), 4) for p in mean_pred],
                "fraction_of_positives": [round(float(f), 4) for f in fraction_pos],
                "brier_score": round(cls_brier, 4),
            }
            class_briers[str(cls)] = round(cls_brier, 4)
        else:
            curves[str(cls)] = {
                "mean_predicted_probability": [],
                "fraction_of_positives": [],
                "brier_score": 0.0,
            }

    return {
        "status": "EVALUATED",
        "multiclass_brier_score": round(overall_brier, 4),
        "class_brier_scores": class_briers,
        "calibration_curves": curves,
        "terminology_notice": "All values represent predicted probabilities, not clinical certainty.",
    }


class ClinicalProbabilityCalibrator:
    """
    Calibrates uncalibrated estimators (e.g. SVM margin distances, raw tree frequencies)
    using held-out calibration partitions.
    """

    def __init__(self, method: str = "sigmoid") -> None:
        """
        method: 'sigmoid' (Platt scaling) or 'isotonic'
        """
        self.method = method
        self.calibrated_pipeline: Optional[Any] = None
        self.calibration_report: Dict[str, Any] = {}

    def fit_calibration(
        self,
        fitted_pipeline: Pipeline,
        X_val: pd.DataFrame,
        y_val: Union[pd.Series, np.ndarray],
    ) -> Pipeline:
        """
        Fit CalibratedClassifierCV using pre-fitted pipeline on validation partition.
        """
        # 1. Baseline pre-calibration evaluation
        baseline_eval = evaluate_calibration(fitted_pipeline, X_val, y_val)

        # 2. Fit probability calibrator
        try:
            from sklearn.frozen import FrozenEstimator
            estimator_to_calibrate = FrozenEstimator(fitted_pipeline)
            calibrated = CalibratedClassifierCV(
                estimator=estimator_to_calibrate,
                method=self.method,
            )
        except (ImportError, TypeError):
            calibrated = CalibratedClassifierCV(
                estimator=fitted_pipeline,
                method=self.method,
                cv="prefit",
            )

        calibrated.fit(X_val, y_val)
        self.calibrated_pipeline = calibrated

        # 3. Post-calibration evaluation
        post_eval = evaluate_calibration(calibrated, X_val, y_val)

        self.calibration_report = {
            "method": self.method,
            "baseline_brier_score": baseline_eval.get("multiclass_brier_score"),
            "calibrated_brier_score": post_eval.get("multiclass_brier_score"),
            "improvement": round(
                (baseline_eval.get("multiclass_brier_score", 0.0) or 0.0)
                - (post_eval.get("multiclass_brier_score", 0.0) or 0.0),
                4,
            ),
            "curves": post_eval.get("calibration_curves", {}),
        }

        logger.info(
            "Calibrated model (%s): Brier score improved from %s to %s",
            self.method,
            self.calibration_report["baseline_brier_score"],
            self.calibration_report["calibrated_brier_score"],
        )
        return calibrated
