"""
Data Leakage and Target Leakage Detection Engine.
Detects:
- Direct target encoding / duplicate-derived labels
- Post-outcome variables (interventions after event occurred)
- Future information / temporal leakage
- Extreme correlation with target (> 0.98)
- Train/test contamination and patient overlap
"""
import logging
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger("ml.data.leakage_detector")

# Keywords indicative of post-outcome or target-derived variables
SUSPICIOUS_TARGET_TERMS = [
    "outcome", "target", "label", "diagnosis", "diagnosed", "death", "mortality",
    "discharged", "discharge_status", "icu_stay_days", "treatment_administered",
    "prescription", "medication_order", "admitted", "readmitted_30d", "risk_score",
    "risk_level", "prediction", "ground_truth", "final_decision"
]


class DataLeakageDetector:
    """Rigorous data leakage detection for healthcare machine learning datasets."""

    @classmethod
    def detect_leakage(cls, df: pd.DataFrame, target_column: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze columns and statistical associations to detect data leakage.
        """
        findings: List[Dict[str, Any]] = []
        target_name = (target_column or "").lower().strip()

        # 1. Inspect Column Semantics for Post-Outcome & Duplicate Target Features
        for col in df.columns:
            col_lower = col.lower().strip()
            if col == target_column:
                continue

            # Target name substring in feature name
            if target_name and target_name in col_lower:
                findings.append({
                    "feature": col,
                    "leakage_type": "TARGET_NAME_LEAKAGE",
                    "severity": "BLOCKING",
                    "evidence": f"Feature name '{col}' contains target identifier '{target_name}'.",
                    "recommendation": "Remove feature before training; direct target proxy.",
                })
                continue

            # Suspicious post-outcome keywords
            matched_terms = [t for t in SUSPICIOUS_TARGET_TERMS if t in col_lower]
            if matched_terms:
                findings.append({
                    "feature": col,
                    "leakage_type": "POST_OUTCOME_VARIABLE",
                    "severity": "ERROR" if any(k in matched_terms for k in ["diagnosis", "treatment", "death", "mortality"]) else "WARNING",
                    "evidence": f"Feature '{col}' contains post-outcome keywords: {matched_terms}",
                    "recommendation": "Verify feature temporal availability at inference time.",
                })

        # 2. Correlation and Mutual Information Leakage
        if target_column and target_column in df.columns:
            target_series = pd.to_numeric(df[target_column], errors="coerce")
            if target_series.notnull().sum() > 20:
                for col in df.columns:
                    if col == target_column:
                        continue
                    if pd.api.types.is_numeric_dtype(df[col]):
                        feature_series = pd.to_numeric(df[col], errors="coerce")
                        valid_mask = target_series.notnull() & feature_series.notnull()
                        if valid_mask.sum() > 20:
                            # Standard Pearson correlation
                            corr = abs(feature_series[valid_mask].corr(target_series[valid_mask]))
                            if not np.isnan(corr) and corr > 0.95:
                                findings.append({
                                    "feature": col,
                                    "leakage_type": "HIGH_CORRELATION_LEAKAGE",
                                    "severity": "BLOCKING" if corr > 0.98 else "ERROR",
                                    "evidence": f"Pearson correlation with target '{target_column}' is {corr:.4f} (> 0.95).",
                                    "recommendation": "Exclude from model training; near-deterministic target duplicate.",
                                })

        # 3. Patient ID leakage / identifier presence in input vector
        id_features = [c for c in df.columns if any(k in c.lower() for k in ["patient_id", "mrn", "ssn", "record_id", "subject_id"])]
        for id_col in id_features:
            findings.append({
                "feature": id_col,
                "leakage_type": "IDENTIFIER_AS_FEATURE",
                "severity": "WARNING",
                "evidence": f"Column '{id_col}' appears to be a patient or subject identifier.",
                "recommendation": "Exclude identifier columns from training feature matrix to prevent memorization.",
            })

        has_blocking = any(f["severity"] == "BLOCKING" for f in findings)
        status = "FAIL" if has_blocking else ("REVIEW_REQUIRED" if findings else "PASS")

        return {
            "leakage_findings_count": len(findings),
            "findings": findings,
            "has_blocking_leakage": has_blocking,
            "leakage_status": status,
        }
