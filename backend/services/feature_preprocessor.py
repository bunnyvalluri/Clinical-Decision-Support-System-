"""
FeaturePreprocessor — Clinical feature normalization, aliasing, and range validation.
"""
from typing import Any
import pandas as pd

from ml.features.schema import FEATURE_LIMITS, FEATURE_NAMES


class FeatureValidationError(Exception):
    """Base exception for structured feature preprocessing and physiological errors."""

    def __init__(
        self,
        message: str,
        field: str | None = None,
        code: str = "VALIDATION_ERROR",
        errors: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.field = field
        self.code = code
        self.errors = errors or ([{"field": field, "code": code, "message": message}] if field else [])

    def to_dict(self) -> dict[str, Any]:
        return {
            "field": self.field,
            "code": self.code,
            "message": self.message,
            "errors": self.errors,
        }


class MissingFeatureError(FeatureValidationError):
    """Raised when critical clinical features are missing."""

    def __init__(self, message: str, field: str | None = None, errors: list[dict[str, Any]] | None = None) -> None:
        super().__init__(message=message, field=field, code="MISSING_REQUIRED", errors=errors)


class InvalidFeatureRangeError(FeatureValidationError):
    """Raised when a feature value falls outside configured physiological limits."""

    def __init__(self, message: str, field: str | None = None, errors: list[dict[str, Any]] | None = None) -> None:
        super().__init__(message=message, field=field, code="OUT_OF_RANGE", errors=errors)


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
        Strictly validate features against physiological bounds and database definitions.
        Emits structured clinical errors without silent imputation or data fabrication.
        """
        validation_errors: list[dict[str, Any]] = []

        # Check required features
        for req in sorted(self.REQUIRED_FEATURES):
            if req not in features or features[req] is None or features[req] == "":
                validation_errors.append({
                    "field": req,
                    "code": "MISSING_REQUIRED",
                    "message": f"Required clinical feature '{req}' is missing or null.",
                })

        # Check against database definitions if available, otherwise fallback to schema limits
        limits = dict(FEATURE_LIMITS)
        try:
            from apps.clinical.models import ClinicalFeatureDefinition
            for cfd in ClinicalFeatureDefinition.objects.filter(is_active=True):
                if cfd.min_value is not None and cfd.max_value is not None:
                    limits[cfd.name] = (float(cfd.min_value), float(cfd.max_value))
        except Exception:
            pass

        for feature_name, (min_val, max_val) in limits.items():
            if feature_name in features and features[feature_name] is not None and features[feature_name] != "":
                val_raw = features[feature_name]
                try:
                    val = float(val_raw)
                except (ValueError, TypeError):
                    validation_errors.append({
                        "field": feature_name,
                        "code": "INVALID_DATATYPE",
                        "message": f"Feature '{feature_name}' must be numeric, got '{val_raw}'.",
                    })
                    continue

                if val < min_val or val > max_val:
                    validation_errors.append({
                        "field": feature_name,
                        "code": "OUT_OF_RANGE",
                        "message": (
                            f"Value {val} for '{feature_name}' is outside configured physiological limits "
                            f"[{min_val}, {max_val}]."
                        ),
                    })

        if validation_errors:
            first = validation_errors[0]
            first_code = first.get("code")
            if first_code == "MISSING_REQUIRED":
                raise MissingFeatureError(
                    message=first["message"],
                    field=first.get("field"),
                    errors=validation_errors,
                )
            if first_code == "OUT_OF_RANGE":
                raise InvalidFeatureRangeError(
                    message=first["message"],
                    field=first.get("field"),
                    errors=validation_errors,
                )
            raise FeatureValidationError(
                message=first["message"],
                field=first.get("field"),
                code=first_code or "VALIDATION_ERROR",
                errors=validation_errors,
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
