"""
Comprehensive Evaluation and Clinical Error Analysis Module.
Calculates multi-class classification metrics: Accuracy, Precision, Recall, F1,
OvR ROC-AUC, OvR PR-AUC (Average Precision), Multi-class Brier score,
Confusion Matrix (raw and normalized), Specificity, Sensitivity,
Inference Latency, and Cost-Asymmetric Clinical Error Impact.
"""
import sys
import time
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import label_binarize

from ml.calibration.calibrator import compute_multiclass_brier_score
from ml.features.schema import TARGET_CLASSES


def compute_classwise_confusion_stats(
    cm: np.ndarray,
    target_classes: List[str],
) -> Dict[str, Dict[str, Any]]:
    """
    Decompose multi-class confusion matrix into class-specific binary One-vs-Rest stats:
    TP, FP, FN, TN, Sensitivity (Recall), Specificity, Precision, and Negative Predictive Value (NPV).
    """
    stats: Dict[str, Dict[str, Any]] = {}
    total_samples = int(np.sum(cm))

    for idx, cls in enumerate(target_classes):
        tp = int(cm[idx, idx])
        fn = int(np.sum(cm[idx, :]) - tp)
        fp = int(np.sum(cm[:, idx]) - tp)
        tn = int(total_samples - (tp + fn + fp))

        sensitivity = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        npv = float(tn / (tn + fn)) if (tn + fn) > 0 else 0.0

        stats[cls] = {
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "true_negatives": tn,
            "sensitivity": round(sensitivity, 4),
            "recall": round(sensitivity, 4),
            "specificity": round(specificity, 4),
            "precision": round(precision, 4),
            "npv": round(npv, 4),
        }

    return stats


def evaluate_clinical_error_impact(
    class_stats: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Perform clinically grounded error analysis.
    In clinical decision support, False Negatives in severe acute states (HIGH, CRITICAL)
    have catastrophic consequences compared to False Positives.
    """
    crit_fn = class_stats.get("CRITICAL", {}).get("false_negatives", 0)
    high_fn = class_stats.get("HIGH", {}).get("false_negatives", 0)
    crit_fp = class_stats.get("CRITICAL", {}).get("false_positives", 0)

    crit_sens = class_stats.get("CRITICAL", {}).get("sensitivity", 0.0)
    high_sens = class_stats.get("HIGH", {}).get("sensitivity", 0.0)

    return {
        "missed_critical_cases": crit_fn,
        "missed_high_risk_cases": high_fn,
        "critical_false_alarms": crit_fp,
        "critical_sensitivity": crit_sens,
        "high_risk_sensitivity": high_sens,
        "clinical_safety_assessment": (
            "EXCELLENT: Zero missed critical/high-risk patients."
            if (crit_fn + high_fn == 0)
            else f"MONITOR: {crit_fn + high_fn} high/critical cases were under-classified. Human physician oversight is required."
        ),
        "asymmetric_risk_notice": (
            "False negatives in HIGH/CRITICAL categories carry severe risks of delayed therapeutic intervention. "
            "Optimization must prioritize recall on high-severity classes over simple overall accuracy."
        ),
    }


def evaluate_model(
    pipeline: Any,
    X_test: pd.DataFrame,
    y_test: Union[pd.Series, np.ndarray],
    target_classes: List[str] = TARGET_CLASSES,
) -> Dict[str, Any]:
    """
    Execute exhaustive multi-class evaluation across discrimination, calibration,
    confusion matrix, specificity, PR-AUC, and clinical error impact.
    """
    # 1. Latency benchmarking
    start_time = time.perf_counter()
    y_pred = pipeline.predict(X_test)
    total_time_ms = (time.perf_counter() - start_time) * 1000.0
    latency_per_sample_ms = round(total_time_ms / max(len(X_test), 1), 3)

    y_test_arr = np.array(y_test)
    eval_classes = list(target_classes)
    model_classes = list(getattr(pipeline, "classes_", eval_classes))

    # Core global metrics
    acc = float(accuracy_score(y_test_arr, y_pred))
    prec_macro = float(precision_score(y_test_arr, y_pred, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_test_arr, y_pred, average="weighted", zero_division=0))
    rec_macro = float(recall_score(y_test_arr, y_pred, average="macro", zero_division=0))
    rec_weighted = float(recall_score(y_test_arr, y_pred, average="weighted", zero_division=0))
    f1_mac = float(f1_score(y_test_arr, y_pred, average="macro", zero_division=0))
    f1_wt = float(f1_score(y_test_arr, y_pred, average="weighted", zero_division=0))

    # Confusion Matrix: raw counts and row-normalized (percentages) in target_classes order
    cm_raw = confusion_matrix(y_test_arr, y_pred, labels=eval_classes)
    row_sums = cm_raw.sum(axis=1, keepdims=True)
    cm_norm = np.divide(cm_raw, row_sums, out=np.zeros_like(cm_raw, dtype=float), where=row_sums != 0)

    class_stats = compute_classwise_confusion_stats(cm_raw, eval_classes)
    clinical_impact = evaluate_clinical_error_impact(class_stats)

    # Probabilistic and Calibration Metrics (ROC-AUC, PR-AUC, Brier score)
    roc_auc_macro: Optional[float] = None
    roc_auc_weighted: Optional[float] = None
    pr_auc_macro: Optional[float] = None
    pr_auc_weighted: Optional[float] = None
    brier_score: Optional[float] = None

    roc_auc_per_class: Dict[str, float] = {}
    pr_auc_per_class: Dict[str, float] = {}

    if hasattr(pipeline, "predict_proba"):
        try:
            y_proba = pipeline.predict_proba(X_test)
            y_bin = label_binarize(y_test_arr, classes=pipeline_classes)

            if y_bin.shape[1] > 1:
                # Multiclass ROC-AUC (OvR)
                roc_auc_macro = float(roc_auc_score(y_bin, y_proba, multi_class="ovr", average="macro"))
                roc_auc_weighted = float(roc_auc_score(y_bin, y_proba, multi_class="ovr", average="weighted"))

                # Multiclass PR-AUC (Average Precision OvR)
                pr_auc_macro = float(average_precision_score(y_bin, y_proba, average="macro"))
                pr_auc_weighted = float(average_precision_score(y_bin, y_proba, average="weighted"))

                # Class-wise ROC-AUC and PR-AUC
                for idx, cls_name in enumerate(pipeline_classes):
                    if len(np.unique(y_bin[:, idx])) > 1:
                        roc_auc_per_class[str(cls_name)] = round(
                            float(roc_auc_score(y_bin[:, idx], y_proba[:, idx])), 4
                        )
                        pr_auc_per_class[str(cls_name)] = round(
                            float(average_precision_score(y_bin[:, idx], y_proba[:, idx])), 4
                        )
                    else:
                        roc_auc_per_class[str(cls_name)] = 0.0
                        pr_auc_per_class[str(cls_name)] = 0.0

            brier_score = compute_multiclass_brier_score(y_test_arr, y_proba, classes=eval_classes)
        except Exception:
            pass

    # Detailed classification report breakdown
    clf_report = classification_report(
        y_test_arr,
        y_pred,
        labels=eval_classes,
        output_dict=True,
        zero_division=0,
    )

    class_wise_metrics: Dict[str, Dict[str, Any]] = {}
    for cls in eval_classes:
        rep_dict = clf_report.get(cls, {})
        c_stat = class_stats.get(cls, {})
        class_wise_metrics[cls] = {
            "precision": round(float(rep_dict.get("precision", 0.0)), 4),
            "recall": round(float(rep_dict.get("recall", 0.0)), 4),
            "sensitivity": round(float(c_stat.get("sensitivity", 0.0)), 4),
            "specificity": round(float(c_stat.get("specificity", 0.0)), 4),
            "f1_score": round(float(rep_dict.get("f1-score", 0.0)), 4),
            "support": int(rep_dict.get("support", 0)),
            "roc_auc": roc_auc_per_class.get(cls),
            "pr_auc": pr_auc_per_class.get(cls),
            "confusion_breakdown": c_stat,
        }

    # Model size estimation
    try:
        import joblib
        import io
        buf = io.BytesIO()
        joblib.dump(pipeline, buf)
        model_size_kb = round(len(buf.getvalue()) / 1024.0, 1)
    except Exception:
        model_size_kb = None

    return {
        "accuracy": round(acc, 4),
        "precision_macro": round(prec_macro, 4),
        "precision_weighted": round(prec_weighted, 4),
        "recall_macro": round(rec_macro, 4),
        "recall_weighted": round(rec_weighted, 4),
        "f1_macro": round(f1_mac, 4),
        "f1_weighted": round(f1_wt, 4),
        "roc_auc_macro": round(roc_auc_macro, 4) if roc_auc_macro is not None else None,
        "roc_auc_weighted": round(roc_auc_weighted, 4) if roc_auc_weighted is not None else None,
        "roc_auc": round(roc_auc_macro, 4) if roc_auc_macro is not None else None,  # backward compat
        "pr_auc_macro": round(pr_auc_macro, 4) if pr_auc_macro is not None else None,
        "pr_auc_weighted": round(pr_auc_weighted, 4) if pr_auc_weighted is not None else None,
        "brier_score": round(brier_score, 4) if brier_score is not None else None,
        "confusion_matrix": cm_raw.tolist(),
        "confusion_matrix_normalized": np.round(cm_norm, 4).tolist(),
        "class_labels": eval_classes,
        "class_wise_metrics": class_wise_metrics,
        "clinical_error_impact": clinical_impact,
        "latency_per_sample_ms": latency_per_sample_ms,
        "model_size_kb": model_size_kb,
        "test_sample_count": len(X_test),
        "averaging_methodology": {
            "multiclass_strategy": "One-vs-Rest (OvR)",
            "macro_averaging": "Unweighted mean across classes (equal class importance)",
            "weighted_averaging": "Support-weighted mean across classes",
        },
    }
