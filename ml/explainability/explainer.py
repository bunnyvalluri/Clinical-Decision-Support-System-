"""
Explainability engine for clinical risk predictions.

IMPORTANT DISTINCTION:
  This module generates MODEL EXPLANATIONS — statistical attributions describing
  which features influenced a machine learning model's score.
  These are NOT medical diagnoses and do NOT prove medical causation.

Supports:
  - SHAP TreeExplainer (RandomForest, GradientBoosting, XGBoost)
  - Feature importance fallback (AdaBoost, SVC, other estimators)
"""
import logging
import math
from typing import Any

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from ml.features.schema import NUMERICAL_FEATURES

logger = logging.getLogger(__name__)

# Medical non-causation disclaimer — MUST accompany every explanation
EXPLANATION_DISCLAIMER = (
    "This is a MODEL EXPLANATION, not a medical diagnosis. "
    "Feature contributions represent statistical associations learned by the model "
    "and do NOT prove medical causation. "
    "Clinical decisions must be made by qualified healthcare professionals."
)


def extract_pipeline_steps(pipeline: Any) -> tuple[Any, Any]:
    """Extract (preprocessor, classifier) from Pipeline, FrozenEstimator, or CalibratedClassifierCV."""
    inner = pipeline
    if hasattr(inner, "estimator"):
        inner = inner.estimator
    if hasattr(inner, "estimator"):  # FrozenEstimator
        inner = inner.estimator

    if hasattr(inner, "named_steps"):
        return inner.named_steps.get("preprocessor"), inner.named_steps.get("classifier")

    if hasattr(pipeline, "calibrated_classifiers_") and len(pipeline.calibrated_classifiers_) > 0:
        base = getattr(pipeline.calibrated_classifiers_[0], "estimator", None)
        if hasattr(base, "named_steps"):
            return base.named_steps.get("preprocessor"), base.named_steps.get("classifier")

    return None, inner


def get_feature_names_from_preprocessor(pipeline: Any) -> list[str]:
    """Retrieve output feature names from the fitted preprocessor inside the pipeline."""
    preprocessor, _ = extract_pipeline_steps(pipeline)
    if preprocessor is not None and hasattr(preprocessor, "get_feature_names_out"):
        try:
            return list(preprocessor.get_feature_names_out())
        except Exception:
            pass
    return NUMERICAL_FEATURES



def _is_tree_shap_compatible(classifier: Any) -> bool:
    """Check whether the fitted estimator is compatible with SHAP TreeExplainer."""
    compatible_types = (
        "RandomForestClassifier",
        "RandomForestRegressor",
        "GradientBoostingClassifier",
        "GradientBoostingRegressor",
        "ExtraTreesClassifier",
        "ExtraTreesRegressor",
        "DecisionTreeClassifier",
        "DecisionTreeRegressor",
    )
    class_name = type(classifier).__name__
    return class_name in compatible_types


def compute_shap_values(
    pipeline: Pipeline,
    X_transformed: np.ndarray,
    predicted_class: str,
) -> tuple[np.ndarray, float, str]:
    """
    Compute SHAP values using TreeExplainer for compatible tree-based models.

    Returns:
        (shap_values_1d, expected_value, method_name)
    """
    import shap

    _, classifier = extract_pipeline_steps(pipeline)
    explainer = getattr(classifier, "_cached_tree_explainer", None)
    if explainer is None:
        explainer = shap.TreeExplainer(classifier)
        try:
            setattr(classifier, "_cached_tree_explainer", explainer)
        except Exception:
            pass
    shap_values = explainer.shap_values(X_transformed)

    # shap_values shape can be (n_samples, n_features, n_classes) or list of arrays
    if isinstance(shap_values, list):
        # One array per class — pick the class matching predicted_class
        classes = list(classifier.classes_)
        try:
            class_idx = classes.index(predicted_class)
        except ValueError:
            class_idx = -1  # Use last class as fallback
        sv = np.array(shap_values[class_idx][0])
        ev = float(explainer.expected_value[class_idx]) if hasattr(explainer.expected_value, "__len__") else float(explainer.expected_value)
    elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        # Shape (n_samples, n_features, n_classes)
        classes = list(classifier.classes_)
        try:
            class_idx = classes.index(predicted_class)
        except ValueError:
            class_idx = -1
        sv = shap_values[0, :, class_idx]
        ev = float(explainer.expected_value[class_idx]) if hasattr(explainer.expected_value, "__len__") else float(explainer.expected_value)
    elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 2:
        sv = shap_values[0]
        ev = float(explainer.expected_value) if not hasattr(explainer.expected_value, "__len__") else float(explainer.expected_value[0])
    else:
        raise ValueError(f"Unexpected SHAP values format: {type(shap_values)}")

    return sv, ev, "TreeSHAP"


def compute_feature_importance_values(
    pipeline: Pipeline,
    feature_names: list[str],
) -> tuple[np.ndarray, float, str]:
    """
    Fallback feature attribution using global feature_importances_ or coef_.
    Returns uniform-like attributions when intrinsic importances are unavailable.
    """
    _, classifier = extract_pipeline_steps(pipeline)
    n_features = len(feature_names)

    if hasattr(classifier, "feature_importances_"):
        raw = classifier.feature_importances_
        if len(raw) == n_features:
            return np.array(raw, dtype=float), 0.0, "FeatureImportance"
    if hasattr(classifier, "coef_"):
        coefs = np.mean(np.abs(classifier.coef_), axis=0)
        if len(coefs) == n_features:
            return coefs.astype(float), 0.0, "LinearCoefficients"

    # Uniform fallback
    return np.full(n_features, 1.0 / n_features), 0.0, "UniformBaseline"


def _sanitize_value(val: Any) -> Any:
    """Ensure a value is JSON-serializable (no NaN/Inf)."""
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    return val


def explain_prediction(
    pipeline: Any,
    input_data: dict[str, Any] | pd.DataFrame,
    predicted_class: str,
    top_n: int = 10,
) -> dict[str, Any]:
    """
    Generate per-feature attributions for an individual inference record.

    For SHAP-compatible models, computes local SHAP values (signed contribution + direction).
    For incompatible models, falls back to global feature importances.

    Returns a structured explanation dict clearly labeled as MODEL_EXPLANATION.
    """
    # Resolve raw record values for display
    if isinstance(input_data, dict):
        raw_record = input_data
    elif isinstance(input_data, pd.DataFrame):
        raw_record = input_data.iloc[0].to_dict()
    else:
        raw_record = dict(input_data)

    preprocessor, classifier = extract_pipeline_steps(pipeline)
    feature_names = get_feature_names_from_preprocessor(pipeline)

    # Transform input through the preprocessor to get the same encoding used for training
    if preprocessor is not None:
        if isinstance(input_data, pd.DataFrame):
            X_transformed = preprocessor.transform(input_data)
        elif isinstance(input_data, dict):
            df_temp = pd.DataFrame([input_data])
            X_transformed = preprocessor.transform(df_temp)
        else:
            X_transformed = preprocessor.transform(pd.DataFrame([input_data]))
    else:
        from ml.features.schema import validate_features
        X_transformed = validate_features(input_data).values


    # Choose explanation method based on model compatibility
    use_shap = _is_tree_shap_compatible(classifier)

    if use_shap:
        try:
            attribution_values, baseline_value, method = compute_shap_values(
                pipeline, X_transformed, predicted_class
            )
        except Exception as exc:
            logger.warning("SHAP computation failed, falling back to feature importance: %s", exc)
            attribution_values, baseline_value, method = compute_feature_importance_values(
                pipeline, feature_names
            )
            use_shap = False
    else:
        attribution_values, baseline_value, method = compute_feature_importance_values(
            pipeline, feature_names
        )

    # Build per-feature contribution list
    abs_total = float(np.sum(np.abs(attribution_values)))
    features_list: list[dict[str, Any]] = []

    for i, feat_name in enumerate(feature_names):
        contribution = float(attribution_values[i])

        # Determine direction
        if abs(contribution) < 1e-6:
            direction = "NEUTRAL"
        elif use_shap:
            direction = "INCREASES_RISK" if contribution > 0 else "DECREASES_RISK"
        else:
            # For non-SHAP methods, importance is always positive; direction is unknown
            direction = "CONTRIBUTING"

        relative_importance = abs(contribution) / abs_total if abs_total > 0 else 0.0

        # Map back to raw patient value (use base feature name without encoding prefix)
        base_feature = feat_name.split("__")[-1]  # Strip one-hot prefix
        raw_val = raw_record.get(base_feature)

        sanitized_val = _sanitize_value(float(raw_val) if isinstance(raw_val, (int, float)) else raw_val) if raw_val is not None and not (isinstance(raw_val, float) and math.isnan(raw_val)) else None

        features_list.append({
            "feature": base_feature,
            "value": sanitized_val,
            "contribution": round(contribution, 6),
            "importance": round(abs(contribution), 6),
            "direction": direction,
            "relative_importance": round(relative_importance, 6),
            "clinical_description": get_clinical_risk_description(base_feature, raw_val),
        })

    # Sort by absolute contribution descending
    features_list.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    # Deduplicate features (one-hot encoded features collapse to same base name)
    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for f in features_list:
        if f["feature"] not in seen:
            seen.add(f["feature"])
            deduped.append(f)

    top_features = deduped[:top_n]

    # Build global feature importances dict (for backward compatibility)
    feature_importances = {}
    for i, fn in enumerate(feature_names):
        base = fn.split("__")[-1]
        v = float(attribution_values[i])
        if base in feature_importances:
            feature_importances[base] = max(feature_importances[base], abs(v))
        else:
            feature_importances[base] = abs(v)

    return {
        "explanation_type": "MODEL_EXPLANATION",
        "method": method,
        "predicted_class": predicted_class,
        "baseline_value": _sanitize_value(baseline_value),
        "features": top_features,
        "feature_importances": {
            k: round(v, 6)
            for k, v in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
        },
        "top_risk_factors": top_features,  # backward compat
        "disclaimer": EXPLANATION_DISCLAIMER,
    }


def get_global_feature_importances(pipeline: Pipeline) -> dict[str, float]:
    """
    Extract global feature importance weights from the fitted estimator.
    Backward-compatible wrapper around compute_feature_importance_values.
    """
    feature_names = get_feature_names_from_preprocessor(pipeline)
    values, _, _ = compute_feature_importance_values(pipeline, feature_names)
    return {
        feat: round(float(v), 4)
        for feat, v in sorted(
            zip(feature_names, values),
            key=lambda x: x[1],
            reverse=True,
        )
    }


def get_clinical_risk_description(feature: str, value: Any) -> str:
    """
    Format evidence-based clinical physiological description for a feature value.
    """
    if value is None:
        return f"{feature}: value not recorded"
    try:
        val = float(value)
    except (ValueError, TypeError):
        return f"{feature}: {value}"

    if feature == "oxygen_saturation":
        if val < 90.0:
            return f"Severe Hypoxemia (SpO2: {val:.1f}%) — significant tissue hypoxia risk"
        elif val < 95.0:
            return f"Mild Hypoxemia (SpO2: {val:.1f}%) — sub-optimal oxygenation"
        return f"Normal SpO2 ({val:.1f}%)"

    elif feature == "heart_rate":
        if val > 100:
            return f"Sinus Tachycardia ({val:.0f} bpm) — elevated myocardial workload"
        elif val < 60:
            return f"Bradycardia ({val:.0f} bpm) — low chronotropic response"
        return f"Normal Heart Rate ({val:.0f} bpm)"

    elif feature == "lactic_acid":
        if val > 4.0:
            return f"Severe hyperlactatemia ({val:.1f} mmol/L) — tissue hypoperfusion marker"
        elif val > 2.0:
            return f"Elevated lactic acid / hyperlactatemia ({val:.1f} mmol/L) — anaerobic metabolism"
        return f"Normal Lactic Acid ({val:.1f} mmol/L)"

    elif feature == "systolic_bp":
        if val >= 160:
            return f"Stage 2 Hypertensive Crisis ({val:.0f} mmHg)"
        elif val < 90:
            return f"Hypotension ({val:.0f} mmHg) — circulatory collapse risk"
        return f"Systolic Blood Pressure: {val:.0f} mmHg"

    elif feature == "glucose_level":
        if val > 200:
            return f"Marked Hyperglycemia ({val:.0f} mg/dL)"
        elif val < 70:
            return f"Hypoglycemia ({val:.0f} mg/dL)"
        return f"Blood Glucose: {val:.0f} mg/dL"

    elif feature == "creatinine":
        if val > 1.5:
            return f"Elevated Creatinine ({val:.2f} mg/dL) — renal impairment marker"
        return f"Normal Creatinine ({val:.2f} mg/dL)"

    return f"{feature.replace('_', ' ').title()}: {val}"
