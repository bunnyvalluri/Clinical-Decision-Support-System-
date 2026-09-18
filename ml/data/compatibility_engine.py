"""
Dataset Compatibility Engine.
Compares candidate Kaggle datasets against the clinical CDSS risk prediction requirements.
Evaluates multi-dimensional criteria:
- Target compatibility
- Feature compatibility
- Clinical relevance
- Sample size and power
- Leakage risk
- PHI and license constraints
Returns PASS, WARNING, FAIL, NEEDS_REVIEW per criterion.
"""
from typing import Any, Dict, List, Optional
import pandas as pd

from ml.data.clinical_validator import FEATURE_ALIASES

# Canonical CDSS risk prediction features
CANONICAL_CDSS_FEATURES = [
    "age", "systolic_bp", "diastolic_bp", "heart_rate",
    "respiratory_rate", "body_temperature", "oxygen_saturation",
    "glucose_level", "cholesterol_total", "bmi"
]

CANDIDATE_TARGET_NAMES = [
    "outcome", "target", "risk_level", "stroke", "cardio",
    "diabetes", "heart_disease", "condition", "status", "class"
]


class DatasetCompatibilityEngine:
    """Evaluates compatibility with the HealthNova CDSS machine learning framework."""

    @classmethod
    def evaluate(
        cls,
        df: pd.DataFrame,
        target_column: Optional[str] = None,
        license_name: str = "",
        privacy_status: str = "DE_IDENTIFIED",
        leakage_findings_count: int = 0,
        quality_score: float = 100.0,
    ) -> Dict[str, Any]:
        """
        Produce structured scorecard across compatibility criteria.
        """
        total_rows, total_cols = df.shape
        criteria: Dict[str, Dict[str, Any]] = {}

        # 1. Target Compatibility
        target_found = target_column if (target_column and target_column in df.columns) else None
        if not target_found:
            for col in df.columns:
                if col.lower().strip() in CANDIDATE_TARGET_NAMES:
                    target_found = col
                    break

        if target_found:
            series = df[target_found].dropna()
            n_classes = series.nunique()
            if n_classes in [2, 3, 4]:
                criteria["target_compatibility"] = {
                    "status": "PASS",
                    "target_column": target_found,
                    "classes": n_classes,
                    "message": f"Target '{target_found}' supports clinical classification ({n_classes} classes).",
                }
            else:
                criteria["target_compatibility"] = {
                    "status": "WARNING",
                    "target_column": target_found,
                    "classes": n_classes,
                    "message": f"Target '{target_found}' has {n_classes} classes (expected 2-4 classes).",
                }
        else:
            criteria["target_compatibility"] = {
                "status": "FAIL",
                "target_column": None,
                "message": "No recognized classification target found.",
            }

        # 2. Feature Compatibility with CDSS Core Vitals
        mapped_features = set()
        for col in df.columns:
            clean = col.lower().strip().replace(" ", "_")
            if clean in CANONICAL_CDSS_FEATURES or clean in FEATURE_ALIASES:
                mapped_features.add(clean)

        coverage_ratio = len(mapped_features) / len(CANONICAL_CDSS_FEATURES)
        if len(mapped_features) >= 4:
            criteria["feature_compatibility"] = {
                "status": "PASS",
                "mapped_count": len(mapped_features),
                "coverage_pct": round(coverage_ratio * 100, 1),
                "mapped_features": list(mapped_features),
                "message": f"Includes {len(mapped_features)} core clinical vitals/labs.",
            }
        elif len(mapped_features) >= 2:
            criteria["feature_compatibility"] = {
                "status": "WARNING",
                "mapped_count": len(mapped_features),
                "coverage_pct": round(coverage_ratio * 100, 1),
                "mapped_features": list(mapped_features),
                "message": f"Includes {len(mapped_features)} vital parameters; imputation or partial feature schema needed.",
            }
        else:
            criteria["feature_compatibility"] = {
                "status": "NEEDS_REVIEW",
                "mapped_count": len(mapped_features),
                "coverage_pct": round(coverage_ratio * 100, 1),
                "mapped_features": list(mapped_features),
                "message": "Low overlap with core CDSS physiological telemetry.",
            }

        # 3. Sample Size and Statistical Power
        if total_rows >= 500:
            criteria["sample_size"] = {
                "status": "PASS",
                "row_count": total_rows,
                "message": f"Cohort size (N={total_rows}) exceeds recommended training threshold (N=500).",
            }
        elif total_rows >= 200:
            criteria["sample_size"] = {
                "status": "WARNING",
                "row_count": total_rows,
                "message": f"Cohort size (N={total_rows}) is modest; cross-validation required to avoid overfitting.",
            }
        else:
            criteria["sample_size"] = {
                "status": "FAIL",
                "row_count": total_rows,
                "message": f"Insufficient sample size (N={total_rows} < 200) for machine learning training.",
            }

        # 4. Data Quality and Completeness
        if quality_score >= 80.0:
            criteria["data_quality"] = {"status": "PASS", "score": quality_score, "message": "High completeness and integrity."}
        elif quality_score >= 60.0:
            criteria["data_quality"] = {"status": "WARNING", "score": quality_score, "message": "Moderate missingness; imputation required."}
        else:
            criteria["data_quality"] = {"status": "FAIL", "score": quality_score, "message": "Low completeness (<60%)."}

        # 5. Data Leakage
        if leakage_findings_count == 0:
            criteria["leakage_risk"] = {"status": "PASS", "findings": 0, "message": "Zero detected leakage signals."}
        else:
            criteria["leakage_risk"] = {
                "status": "NEEDS_REVIEW",
                "findings": leakage_findings_count,
                "message": f"{leakage_findings_count} potential leakage findings require informaticist audit.",
            }

        # 6. Licensing & Legal Permissions
        lic_upper = license_name.upper()
        if any(ok in lic_upper for ok in ["CC0", "PUBLIC DOMAIN", "CC BY", "ODBL", "OPEN"]):
            criteria["licensing"] = {"status": "PASS", "license": license_name, "message": "Permissive open dataset license."}
        elif lic_upper in ["UNKNOWN", "OTHER", ""]:
            criteria["licensing"] = {"status": "NEEDS_REVIEW", "license": license_name or "Unknown", "message": "License terms require legal verification."}
        else:
            criteria["licensing"] = {"status": "WARNING", "license": license_name, "message": f"Restricted license: {license_name}."}

        # Overall recommendation
        statuses = [v["status"] for v in criteria.values()]
        if "FAIL" in statuses:
            overall_recommendation = "REJECT"
        elif "NEEDS_REVIEW" in statuses or "WARNING" in statuses:
            overall_recommendation = "APPROVED_FOR_RESEARCH"
        else:
            overall_recommendation = "APPROVED_FOR_TRAINING"

        return {
            "criteria": criteria,
            "overall_recommendation": overall_recommendation,
            "is_training_compatible": overall_recommendation in ["APPROVED_FOR_TRAINING", "APPROVED_FOR_RESEARCH"],
            "designated_use": "RESEARCH_AND_BENCHMARKING",
            "production_gate": "BLOCKED_REQUIRES_HUMAN_CLINICIAN_SIGN_OFF",
        }
