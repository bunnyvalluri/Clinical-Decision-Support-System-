"""
Comprehensive evaluation module for clinical risk prediction models.
Calculates accuracy, precision, recall, F1, multi-class ROC-AUC, confusion matrix,
and class-wise metrics on held-out test data.
"""
from typing import Any
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import label_binarize

from ml.features.schema import TARGET_CLASSES


def evaluate_model(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series | np.ndarray,
    target_classes: list[str] = TARGET_CLASSES,
) -> dict[str, Any]:
    """
    Evaluate fitted pipeline on held-out test data.
    Computes global and class-wise performance metrics.
    """
    y_pred = pipeline.predict(X_test)
    y_test_arr = np.array(y_test)

    # Core global metrics
    acc = float(accuracy_score(y_test_arr, y_pred))
    prec_macro = float(precision_score(y_test_arr, y_pred, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_test_arr, y_pred, average="weighted", zero_division=0))
    rec_macro = float(recall_score(y_test_arr, y_pred, average="macro", zero_division=0))
    rec_weighted = float(recall_score(y_test_arr, y_pred, average="weighted", zero_division=0))
    f1_mac = float(f1_score(y_test_arr, y_pred, average="macro", zero_division=0))
    f1_wt = float(f1_score(y_test_arr, y_pred, average="weighted", zero_division=0))

    # Confusion Matrix
    cm = confusion_matrix(y_test_arr, y_pred, labels=target_classes).tolist()

    # Multi-class One-vs-Rest ROC-AUC
    roc_auc: float | None = None
    roc_auc_per_class: dict[str, float] = {}

    if hasattr(pipeline, "predict_proba"):
        try:
            y_proba = pipeline.predict_proba(X_test)
            pipeline_classes = list(getattr(pipeline, "classes_", target_classes))

            # Binarize labels matching pipeline's classes order
            y_bin = label_binarize(y_test_arr, classes=pipeline_classes)

            if y_bin.shape[1] > 1:
                roc_auc = float(
                    roc_auc_score(
                        y_bin,
                        y_proba,
                        multi_class="ovr",
                        average="weighted",
                    )
                )
                for idx, cls_name in enumerate(pipeline_classes):
                    if len(np.unique(y_bin[:, idx])) > 1:
                        roc_auc_per_class[str(cls_name)] = float(
                            roc_auc_score(y_bin[:, idx], y_proba[:, idx])
                        )
                    else:
                        roc_auc_per_class[str(cls_name)] = 0.0
        except Exception:
            roc_auc = None

    # Detailed classification report breakdown
    clf_report = classification_report(
        y_test_arr,
        y_pred,
        labels=target_classes,
        output_dict=True,
        zero_division=0,
    )

    class_wise: dict[str, dict[str, Any]] = {}
    for cls in target_classes:
        metrics_dict = clf_report.get(cls, {})
        class_wise[cls] = {
            "precision": float(metrics_dict.get("precision", 0.0)),
            "recall": float(metrics_dict.get("recall", 0.0)),
            "f1_score": float(metrics_dict.get("f1-score", 0.0)),
            "support": int(metrics_dict.get("support", 0)),
            "roc_auc": roc_auc_per_class.get(cls),
        }

    results: dict[str, Any] = {
        "accuracy": round(acc, 4),
        "precision_macro": round(prec_macro, 4),
        "precision_weighted": round(prec_weighted, 4),
        "recall_macro": round(rec_macro, 4),
        "recall_weighted": round(rec_weighted, 4),
        "f1_macro": round(f1_mac, 4),
        "f1_weighted": round(f1_wt, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "confusion_matrix": cm,
        "class_labels": target_classes,
        "class_wise_metrics": class_wise,
        "test_sample_count": len(X_test),
    }

    return results
