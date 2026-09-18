"""
Clinical Range and Biological Contradiction Validator.
Enforces evidence-based physiological limits and contradictions without blindly deleting records.
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd


@dataclass
class ClinicalRule:
    feature_name: str
    unit: str
    min_val: float
    max_val: float
    source: str
    severity: str  # "INFO", "WARNING", "ERROR", "BLOCKING"


# Evidence-based physiological reference ranges from published clinical guidelines
EVIDENCE_BASED_CLINICAL_RULES: List[ClinicalRule] = [
    ClinicalRule("age", "years", 0.0, 125.0, "WHO Life Span Thresholds", "BLOCKING"),
    ClinicalRule("systolic_bp", "mmHg", 50.0, 260.0, "AHA/ACC 2017 Guidelines", "ERROR"),
    ClinicalRule("diastolic_bp", "mmHg", 30.0, 150.0, "AHA/ACC 2017 Guidelines", "ERROR"),
    ClinicalRule("heart_rate", "bpm", 25.0, 250.0, "ACLS Critical Physiology", "ERROR"),
    ClinicalRule("respiratory_rate", "breaths/min", 6.0, 60.0, "NEWS2 Clinical Scoring", "ERROR"),
    ClinicalRule("body_temperature", "celsius", 32.0, 43.0, "CDC Clinical Thermoregulation", "ERROR"),
    ClinicalRule("oxygen_saturation", "%", 50.0, 100.0, "Pulse Oximetry Biological Max", "BLOCKING"),
    ClinicalRule("glucose_level", "mg/dL", 20.0, 800.0, "ADA Standards of Medical Care", "ERROR"),
    ClinicalRule("cholesterol_total", "mg/dL", 50.0, 600.0, "NCEP ATP III", "WARNING"),
    ClinicalRule("bmi", "kg/m²", 10.0, 75.0, "WHO Obesity Classifications", "ERROR"),
    ClinicalRule("creatinine", "mg/dL", 0.1, 20.0, "KDIGO AKI Clinical Practice", "ERROR"),
    ClinicalRule("sodium", "mEq/L", 100.0, 180.0, "Electrolyte Homeostasis Limits", "ERROR"),
    ClinicalRule("calcium", "mg/dL", 4.0, 16.0, "Endocrine Clinical Physiology", "ERROR"),
    ClinicalRule("lactic_acid", "mmol/L", 0.2, 25.0, "Surviving Sepsis Campaign", "ERROR"),
]

# Aliases matching Kaggle dataset feature naming conventions
FEATURE_ALIASES: Dict[str, str] = {
    "age": "age",
    "bloodpressure": "diastolic_bp",  # PIMA BloodPressure is diastolic!
    "trestbps": "systolic_bp",       # Heart Disease trestbps is resting systolic BP
    "ap_hi": "systolic_bp",          # Cardio dataset
    "ap_lo": "diastolic_bp",          # Cardio dataset
    "chol": "cholesterol_total",
    "cholesterol": "cholesterol_total",
    "gluc": "glucose_level",
    "glucose": "glucose_level",
    "avg_glucose_level": "glucose_level",
    "bmi": "bmi",
    "heartrate": "heart_rate",
    "heart_rate": "heart_rate",
    "thalach": "heart_rate",         # Max heart rate achieved
}


class ClinicalRangeValidator:
    """Validates physiological consistency and catches biological impossibilities."""

    @classmethod
    def validate_dataframe(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Scan a dataset for clinical range violations and biological contradictions.
        """
        violations: List[Dict[str, Any]] = []
        contradictions: List[Dict[str, Any]] = []
        rule_map = {r.feature_name: r for r in EVIDENCE_BASED_CLINICAL_RULES}

        # Map DataFrame columns to canonical clinical features
        col_mapping = {}
        for col in df.columns:
            clean = col.lower().strip().replace(" ", "_")
            if clean in rule_map:
                col_mapping[col] = clean
            elif clean in FEATURE_ALIASES:
                col_mapping[col] = FEATURE_ALIASES[clean]

        # 1. Range Validation
        for raw_col, canonical in col_mapping.items():
            rule = rule_map.get(canonical)
            if not rule:
                continue

            series = pd.to_numeric(df[raw_col], errors="coerce").dropna()
            if len(series) == 0:
                continue

            below_min = series < rule.min_val
            above_max = series > rule.max_val
            violation_count = int((below_min | above_max).sum())

            if violation_count > 0:
                violations.append({
                    "column": raw_col,
                    "canonical_feature": canonical,
                    "unit": rule.unit,
                    "min_allowed": rule.min_val,
                    "max_allowed": rule.max_val,
                    "violation_count": violation_count,
                    "violation_pct": round(violation_count / len(series) * 100.0, 2),
                    "min_observed": float(series.min()),
                    "max_observed": float(series.max()),
                    "source": rule.source,
                    "severity": rule.severity,
                })

        # 2. Biological Contradiction Checks
        # SBP vs DBP: Systolic MUST be strictly greater than Diastolic
        sbp_col = next((c for c, can in col_mapping.items() if can == "systolic_bp"), None)
        dbp_col = next((c for c, can in col_mapping.items() if can == "diastolic_bp"), None)

        if sbp_col and dbp_col:
            sbp = pd.to_numeric(df[sbp_col], errors="coerce")
            dbp = pd.to_numeric(df[dbp_col], errors="coerce")
            valid_mask = sbp.notnull() & dbp.notnull()
            sbp_le_dbp = (sbp[valid_mask] <= dbp[valid_mask]).sum()

            if sbp_le_dbp > 0:
                contradictions.append({
                    "type": "BLOOD_PRESSURE_INVERSION",
                    "severity": "BLOCKING",
                    "description": f"Systolic BP <= Diastolic BP in {int(sbp_le_dbp)} records ({sbp_col} vs {dbp_col}).",
                    "count": int(sbp_le_dbp),
                })

        # SpO2 > 100% check
        spo2_col = next((c for c, can in col_mapping.items() if can == "oxygen_saturation"), None)
        if spo2_col:
            spo2 = pd.to_numeric(df[spo2_col], errors="coerce")
            impossible_spo2 = (spo2 > 100.0).sum()
            if impossible_spo2 > 0:
                contradictions.append({
                    "type": "IMPOSSIBLE_SPO2",
                    "severity": "BLOCKING",
                    "description": f"Oxygen saturation > 100% in {int(impossible_spo2)} records.",
                    "count": int(impossible_spo2),
                })

        # Glucose = 0 in clinical datasets (known anomaly in PIMA diabetes where 0 was used as missing!)
        glu_col = next((c for c, can in col_mapping.items() if can == "glucose_level"), None)
        if glu_col:
            glu = pd.to_numeric(df[glu_col], errors="coerce")
            zero_glucose = (glu == 0.0).sum()
            if zero_glucose > 0:
                contradictions.append({
                    "type": "ZERO_GLUCOSE_ANOMALY",
                    "severity": "WARNING",
                    "description": f"Blood glucose is 0 in {int(zero_glucose)} records (likely unencoded missing value in legacy dataset).",
                    "count": int(zero_glucose),
                })

        has_blocking = any(c["severity"] == "BLOCKING" for c in contradictions) or any(v["severity"] == "BLOCKING" for v in violations)

        return {
            "mapped_features_count": len(col_mapping),
            "range_violations": violations,
            "biological_contradictions": contradictions,
            "has_blocking_violations": has_blocking,
            "clinical_suitability_status": "UNSUITABLE" if has_blocking else ("REVIEW_REQUIRED" if violations else "PASS"),
        }
