"""
FeaturePreprocessor — Clinical feature normalization, aliasing, and range validation.
"""
from typing import Any
import pandas as pd

from ml.features.schema import FEATURE_LIMITS, FEATURE_NAMES


class FeatureValidationError(Exception):
    """Base exception for feature preprocessing errors."""
    pass


class MissingFeatureError(FeatureValidationError):
    """Raised when critical clinical features are missing."""
    pass


class InvalidFeatureRangeError(FeatureValidationError):
    """Raised when a feature value falls outside physiological limits."""
    pass


class FeaturePreprocessor:
    """
    Validates and transforms raw clinical inputs into ordered DataFrames
    ready for model preprocessing and inference.
    """

    FEATURE_MAPPING: dict[str, str] = {
        "temperature": "body_temperature",
        "glucose": "glucose_level",
        "cholesterol": "cholesterol_total",
    }

    REQUIRED_FEATURES: set[str] = {
        "age",
        "gender",
    }

    def __init__(self, feature_names: list[str] | None = None) -> None:
        self.feature_names = feature_names or list(FEATURE_NAMES)

    def normalize_aliases(self, data: dict[str, Any]) -> dict[str, Any]:
        """Convert known alias keys (e.g. temperature -> body_temperature)."""
        normalized: dict[str, Any] = {}
        for key, val in data.items():
            mapped_key = self.FEATURE_MAPPING.get(key, key)
            normalized[mapped_key] = val
        return normalized

    def normalize_gender(self, gender: Any) -> str:
        """Normalize gender representations into standard abbreviations."""
        if not gender:
            return "Other"
        g_str = str(gender).strip().upper()
        if g_str in ("M", "MALE"):
            return "M"
        if g_str in ("F", "FEMALE"):
            return "F"
        return "Other"

    def validate_features(self, features: dict[str, Any]) -> None:
        """
        Ensure all required features exist and are within physiologically possible ranges.
        """
        missing = [f for f in self.REQUIRED_FEATURES if f not in features or features[f] is None]
        if missing:
            raise MissingFeatureError(
                f"Missing required clinical features for prediction: {sorted(missing)}"
            )

        for feature_name, (min_val, max_val) in FEATURE_LIMITS.items():
            if feature_name in features and features[feature_name] is not None:
                try:
                    val = float(features[feature_name])
                except (ValueError, TypeError) as exc:
                    raise FeatureValidationError(
                        f"Feature '{feature_name}' must be numeric, got '{features[feature_name]}'"
                    ) from exc

                if val < min_val or val > max_val:
                    raise InvalidFeatureRangeError(
                        f"Feature '{feature_name}' value {val} out of physiological bounds [{min_val}, {max_val}]."
                    )

    def prepare_dataframe(self, features_dict: dict[str, Any]) -> tuple[pd.DataFrame, dict[str, Any]]:
        """
        Normalize, validate, and convert a single record into an ordered 1-row DataFrame.
        Returns:
            tuple of (DataFrame, clean_normalized_feature_snapshot)
        """
        normalized = self.normalize_aliases(features_dict)
        if "gender" in normalized:
            normalized["gender"] = self.normalize_gender(normalized["gender"])

        self.validate_features(normalized)

        # Build clean snapshot strictly with model supported features
        import numpy as np
        snapshot: dict[str, Any] = {}
        row: dict[str, Any] = {}
        for col in self.feature_names:
            val = normalized.get(col)
            if col == "gender":
                row[col] = val or "Other"
                snapshot[col] = row[col]
            else:
                row[col] = float(val) if val is not None else np.nan
                snapshot[col] = float(val) if val is not None else None

        df = pd.DataFrame([row], columns=self.feature_names)
        return df, snapshot

    def prepare_batch_dataframe(
        self, records: list[dict[str, Any]]
    ) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
        """
        Normalize and validate a batch of records into an ordered multi-row DataFrame.
        """
        rows: list[dict[str, Any]] = []
        snapshots: list[dict[str, Any]] = []

        for idx, rec in enumerate(records):
            try:
                _, snap = self.prepare_dataframe(rec)
                rows.append(snap)
                snapshots.append(snap)
            except FeatureValidationError as exc:
                raise FeatureValidationError(f"Batch item at index {idx} invalid: {exc}") from exc

        df = pd.DataFrame(rows, columns=self.feature_names)
        return df, snapshots
