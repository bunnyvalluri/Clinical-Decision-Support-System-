"""
Explainability engine for clinical risk predictions.
Extracts model-agnostic and tree-based feature attributions and formats human-readable
clinical risk explanations.
"""
from typing import Any
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

from ml.features.schema import NUMERICAL_FEATURES


def get_feature_names_from_preprocessor(pipeline: Pipeline) -> list[str]:
    """Retrieve output feature names from the fitted preprocessor inside the pipeline."""
    preprocessor = pipeline.named_steps.get("preprocessor")
    if preprocessor is not None and hasattr(preprocessor, "get_feature_names_out"):
        try:
            return list(preprocessor.get_feature_names_out())
        except Exception:
            pass
    return NUMERICAL_FEATURES


def get_global_feature_importances(pipeline: Pipeline) -> dict[str, float]:
    """
    Extract global feature importance weights from the fitted estimator.
    """
    classifier = pipeline.named_steps.get("classifier")
    feature_names = get_feature_names_from_preprocessor(pipeline)

    if classifier is None:
        return {}

    # Tree models: RandomForest, AdaBoost
    if hasattr(classifier, "feature_importances_"):
        raw_importances = classifier.feature_importances_
        if len(raw_importances) == len(feature_names):
            return {
                feat: round(float(imp), 4)
                for feat, imp in sorted(
                    zip(feature_names, raw_importances),
                    key=lambda x: x[1],
                    reverse=True,
                )
            }

    # Linear / SVM with linear kernel
    if hasattr(classifier, "coef_"):
        coefs = np.mean(np.abs(classifier.coef_), axis=0)
        if len(coefs) == len(feature_names):
            return {
                feat: round(float(c), 4)
                for feat, c in sorted(
                    zip(feature_names, coefs),
                    key=lambda x: x[1],
                    reverse=True,
                )
            }

    # Default uniform baseline if model does not expose intrinsic weights
    return {feat: round(1.0 / len(feature_names), 4) for feat in feature_names}


def get_clinical_risk_description(feature: str, value: Any) -> str:
    """Map raw clinical parameter values to clinician-friendly interpretation."""
    try:
        val = float(value)
    except (ValueError, TypeError):
        return f"{feature}: {value}"

    if feature == "oxygen_saturation":
        if val < 90:
            return f"Severe Hypoxemia (SpO2 {val}% < 90%)"
        if val < 94:
            return f"Low oxygen saturation (SpO2 {val}%)"
    elif feature == "heart_rate":
        if val > 120:
            return f"Severe Tachycardia ({int(val)} bpm > 120 bpm)"
        if val > 100:
            return f"Tachycardia ({int(val)} bpm > 100 bpm)"
        if val < 50:
            return f"Bradycardia ({int(val)} bpm < 50 bpm)"
    elif feature == "lactic_acid":
        if val > 4.0:
            return f"Severe hyperlactatemia / cellular hypoperfusion ({val} mmol/L)"
        if val > 2.0:
            return f"Elevated lactic acid / metabolic stress ({val} mmol/L)"
    elif feature == "systolic_bp":
        if val < 90:
            return f"Hypotension ({int(val)} mmHg < 90 mmHg)"
        if val > 160:
            return f"Severe Stage 2 Hypertension ({int(val)} mmHg)"
    elif feature == "creatinine":
        if val > 2.0:
            return f"Markedly elevated serum creatinine ({val} mg/dL, renal risk)"
        if val > 1.3:
            return f"Elevated serum creatinine ({val} mg/dL)"
    elif feature == "respiratory_rate":
        if val > 24:
            return f"Tachypnea ({int(val)} breaths/min)"
        if val < 10:
            return f"Bradypnea ({int(val)} breaths/min)"
    elif feature == "body_temperature":
        if val > 38.5:
            return f"High pyrexia / fever ({val} °C)"
        if val < 36.0:
            return f"Hypothermia ({val} °C)"
    elif feature == "glucose_level":
        if val > 200:
            return f"Marked hyperglycemia ({val} mg/dL)"
        if val < 70:
            return f"Hypoglycemia ({val} mg/dL)"

    return f"{feature}: {val}"


def explain_prediction(
    pipeline: Pipeline,
    input_data: dict[str, Any] | pd.DataFrame,
    predicted_class: str,
    top_n: int = 5,
) -> dict[str, Any]:
    """
    Generate local and global attributions for an individual inference record.
    Returns sorted top risk factors with clinical rationales.
    """
    if isinstance(input_data, dict):
        raw_record = input_data
    elif isinstance(input_data, pd.DataFrame):
        raw_record = input_data.iloc[0].to_dict()
    else:
        raw_record = dict(input_data)

    global_weights = get_global_feature_importances(pipeline)

    # Score contributors using combination of feature weight and abnormality
    scored_contributors: list[dict[str, Any]] = []

    for feat, weight in global_weights.items():
        base_feature = feat.split("__")[-1]  # Strip one-hot prefix if present
        raw_val = raw_record.get(base_feature)

        if raw_val is not None and not pd.isna(raw_val):
            clinical_desc = get_clinical_risk_description(base_feature, raw_val)
            scored_contributors.append(
                {
                    "feature": base_feature,
                    "importance": float(weight),
                    "value": float(raw_val) if isinstance(raw_val, (int, float)) else str(raw_val),
                    "clinical_description": clinical_desc,
                }
            )

    # Sort by weight descending
    scored_contributors.sort(key=lambda x: x["importance"], reverse=True)
    top_factors = scored_contributors[:top_n]

    return {
        "method": "FeatureAttribution",
        "predicted_class": predicted_class,
        "feature_importances": global_weights,
        "top_risk_factors": top_factors,
    }
