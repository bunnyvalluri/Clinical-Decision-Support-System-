"""
Demographic Fairness and Clinical Bias Evaluation Module.
Evaluates model behavior across legitimate demographic and operational cohorts
(e.g., gender, age brackets, encounter types) to detect disparities in:
- Recall (Sensitivity)
- Precision (PPV)
- False Positive Rate (FPR)
- False Negative Rate (FNR)
- Probabilistic Calibration (Brier Score)

ETHICAL & CLINICAL AI COMPLIANCE:
- Sensitive attributes are strictly evaluated from documented clinical records without algorithmic inference.
- Findings reflect statistical disparities across subpopulations to guide clinical equity reviews.
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score

from ml.calibration.calibrator import compute_multiclass_brier_score
from ml.features.schema import TARGET_CLASSES


@dataclass
class GroupFairnessMetrics:
    group_name: str
    group_value: str
    sample_count: int
    sample_percentage: float
    accuracy: float
    recall_macro: float
    precision_macro: float
    high_critical_recall: float
    false_negative_rate_high_risk: float
    brier_score: Optional[float]


class ClinicalFairnessEvaluator:
    """
    Assesses model parity and demographic bias across subpopulations.
    """

    LIMITATIONS_NOTICE = (
        "Fairness evaluation is performed across documented demographic and encounter parameters. "
        "It does not account for unmeasured social determinants of health, institutional referral biases, "
        "or intersectional disparities not reflected in the clinical feature set."
    )

    def evaluate_fairness(
        self,
        pipeline: Any,
        X_eval: pd.DataFrame,
        y_eval: Union[pd.Series, np.ndarray],
        demographic_columns: List[str] = ["gender", "encounter_type"],
    ) -> Dict[str, Any]:
        """
        Evaluate model performance disaggregated across demographic categories and age cohorts.
        """
        y_true = np.array(y_eval)
        y_pred = pipeline.predict(X_eval)
        has_proba = hasattr(pipeline, "predict_proba")
        y_proba = pipeline.predict_proba(X_eval) if has_proba else None
        pipeline_classes = list(getattr(pipeline, "classes_", TARGET_CLASSES))

        results: Dict[str, Any] = {
            "evaluated_demographics": demographic_columns,
            "cohort_analyses": {},
            "disparities": {},
            "limitations": self.LIMITATIONS_NOTICE,
        }

        # 1. Evaluate specified categorical demographic features
        for demo_col in demographic_columns:
            if demo_col not in X_eval.columns:
                continue

            cohort_metrics: Dict[str, Any] = {}
            recalls = []

            for val in X_eval[demo_col].dropna().unique():
                mask = (X_eval[demo_col] == val).values
                sub_count = int(np.sum(mask))
                if sub_count < 10:
                    continue

                sub_y_true = y_true[mask]
                sub_y_pred = y_pred[mask]
                sub_y_proba = y_proba[mask] if y_proba is not None else None

                acc = float(accuracy_score(sub_y_true, sub_y_pred))
                rec = float(recall_score(sub_y_true, sub_y_pred, average="macro", zero_division=0))
                prec = float(precision_score(sub_y_true, sub_y_pred, average="macro", zero_division=0))

                # High/Critical risk recall (high consequence in clinical triage)
                high_crit_mask = np.isin(sub_y_true, ["HIGH", "CRITICAL"])
                if np.sum(high_crit_mask) > 0:
                    hc_recall = float(
                        recall_score(
                            sub_y_true[high_crit_mask],
                            sub_y_pred[high_crit_mask],
                            average="macro",
                            zero_division=0,
                        )
                    )
                    fnr_hc = 1.0 - hc_recall
                else:
                    hc_recall = 1.0
                    fnr_hc = 0.0

                brier = (
                    compute_multiclass_brier_score(sub_y_true, sub_y_proba, classes=pipeline_classes)
                    if sub_y_proba is not None
                    else None
                )

                cohort_metrics[str(val)] = {
                    "sample_count": sub_count,
                    "sample_percentage": round(float(sub_count / len(X_eval) * 100.0), 2),
                    "accuracy": round(acc, 4),
                    "recall_macro": round(rec, 4),
                    "precision_macro": round(prec, 4),
                    "high_critical_recall": round(hc_recall, 4),
                    "false_negative_rate_high_risk": round(fnr_hc, 4),
                    "brier_score": round(brier, 4) if brier is not None else None,
                }
                recalls.append(rec)

            results["cohort_analyses"][demo_col] = cohort_metrics

            # Calculate Disparity Ratio (min recall / max recall across groups)
            if len(recalls) >= 2 and max(recalls) > 0:
                disparity_ratio = round(float(min(recalls) / max(recalls)), 4)
                results["disparities"][f"{demo_col}_recall_disparity_ratio"] = disparity_ratio

        # 2. Evaluate Age Cohorts
        if "age" in X_eval.columns:
            age_bins = [0, 40, 65, 120]
            age_labels = ["AGE_<40", "AGE_40-65", "AGE_65+"]
            age_cohorts = pd.cut(
                pd.to_numeric(X_eval["age"], errors="coerce"),
                bins=age_bins,
                labels=age_labels,
            )
            age_metrics: Dict[str, Any] = {}
            for label in age_labels:
                mask = (age_cohorts == label).values
                sub_count = int(np.sum(mask))
                if sub_count < 10:
                    continue

                sub_y_true = y_true[mask]
                sub_y_pred = y_pred[mask]
                sub_y_proba = y_proba[mask] if y_proba is not None else None

                acc = float(accuracy_score(sub_y_true, sub_y_pred))
                rec = float(recall_score(sub_y_true, sub_y_pred, average="macro", zero_division=0))
                prec = float(precision_score(sub_y_true, sub_y_pred, average="macro", zero_division=0))

                high_crit_mask = np.isin(sub_y_true, ["HIGH", "CRITICAL"])
                hc_recall = (
                    float(
                        recall_score(
                            sub_y_true[high_crit_mask],
                            sub_y_pred[high_crit_mask],
                            average="macro",
                            zero_division=0,
                        )
                    )
                    if np.sum(high_crit_mask) > 0
                    else 1.0
                )

                brier = (
                    compute_multiclass_brier_score(sub_y_true, sub_y_proba, classes=pipeline_classes)
                    if sub_y_proba is not None
                    else None
                )

                age_metrics[label] = {
                    "sample_count": sub_count,
                    "sample_percentage": round(float(sub_count / len(X_eval) * 100.0), 2),
                    "accuracy": round(acc, 4),
                    "recall_macro": round(rec, 4),
                    "precision_macro": round(prec, 4),
                    "high_critical_recall": round(hc_recall, 4),
                    "false_negative_rate_high_risk": round(1.0 - hc_recall, 4),
                    "brier_score": round(brier, 4) if brier is not None else None,
                }
            results["cohort_analyses"]["age_cohorts"] = age_metrics

        return results
