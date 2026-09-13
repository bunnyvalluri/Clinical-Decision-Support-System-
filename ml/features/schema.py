"""
Feature schema definition and input validation for patient risk prediction models.
Defines the explicit domain feature contracts required by ML models.
"""
from typing import Any
import pandas as pd

# Numerical clinical observation parameters supported by the model
NUMERICAL_FEATURES: list[str] = [
    "age",
    "systolic_bp",
    "diastolic_bp",
    "heart_rate",
    "respiratory_rate",
    "body_temperature",
    "oxygen_saturation",
    "glucose_level",
    "cholesterol_total",
    "bmi",
    "creatinine",
    "sodium",
    "calcium",
    "lactic_acid",
]

# Categorical demographic and encounter indicators
CATEGORICAL_FEATURES: list[str] = [
    "gender",
    "encounter_type",
]

# Total input feature list in fixed, deterministic ordering
FEATURE_NAMES: list[str] = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

TARGET_COLUMN: str = "risk_level"

TARGET_CLASSES: list[str] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# Reference physiological limits for runtime input sanity checks
FEATURE_LIMITS: dict[str, tuple[float, float]] = {
    "age": (0.0, 130.0),
    "systolic_bp": (40.0, 300.0),
    "diastolic_bp": (20.0, 200.0),
    "heart_rate": (20.0, 300.0),
    "respiratory_rate": (4.0, 100.0),
    "body_temperature": (25.0, 45.0),
    "oxygen_saturation": (0.0, 100.0),
    "glucose_level": (1.0, 1500.0),
    "cholesterol_total": (1.0, 1200.0),
    "bmi": (5.0, 120.0),
    "creatinine": (0.1, 30.0),
    "sodium": (80.0, 200.0),
    "calcium": (2.0, 25.0),
    "lactic_acid": (0.0, 35.0),
}

NUMERICAL_RANGES = FEATURE_LIMITS


def validate_features(data: dict[str, Any] | list[dict[str, Any]] | pd.DataFrame) -> pd.DataFrame:
    """
    Validate, sanitize, and format input observations into a DataFrame
    guaranteeing strict column ordering matching FEATURE_NAMES.
    """
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    elif isinstance(data, list):
        df = pd.DataFrame(data)
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        raise ValueError(f"Unsupported data type for feature validation: {type(data)}")

    # Ensure all required feature columns are present (fill missing with None/NaN)
    for col in FEATURE_NAMES:
        if col not in df.columns:
            df[col] = None

    # Enforce numeric conversion for numerical features
    for col in NUMERICAL_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Enforce string conversion for categorical features
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].astype(str).replace({"None": "UNKNOWN", "nan": "UNKNOWN", "": "UNKNOWN"}).str.upper()

    if "gender" in df.columns:
        gender_map = {"M": "MALE", "MALE": "MALE", "F": "FEMALE", "FEMALE": "FEMALE", "OTHER": "OTHER"}
        df["gender"] = df["gender"].map(lambda g: gender_map.get(str(g).upper(), "UNKNOWN"))

    # Reorder columns to the canonical feature ordering
    return df[FEATURE_NAMES]
