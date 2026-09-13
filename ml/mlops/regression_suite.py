"""
ML Model Regression Testing Suite.
Evaluates candidate models against production champions on a curated "Golden" evaluation benchmark.
Prevents silent regression where a model improves overall accuracy by sacrificing high-risk clinical sensitivity.
"""
from dataclasses import dataclass
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from ml.calibration.calibrator import compute_multiclass_brier_score
from ml.evaluation.evaluator import evaluate_model
from ml.features.schema import FEATURE_NAMES, TARGET_CLASSES, TARGET_COLUMN

logger = logging.getLogger(__name__)

GOLDEN_BENCHMARK_FILE = Path(__file__).resolve().parent.parent / "data" / "golden_benchmark.csv"


def create_or_load_golden_benchmark() -> pd.DataFrame:
    """
    Load or generate a curated golden evaluation dataset containing verified physiological profiles
    spanning standard, borderline, and high-severity clinical scenarios.
    """
    if GOLDEN_BENCHMARK_FILE.exists():
        return pd.read_csv(GOLDEN_BENCHMARK_FILE)

    records = [
        # Normal healthy low-risk
        {"age": 25.0, "systolic_bp": 115, "diastolic_bp": 74, "heart_rate": 68, "respiratory_rate": 14,
         "body_temperature": 36.7, "oxygen_saturation": 99.0, "glucose_level": 88.0, "cholesterol_total": 170.0,
         "bmi": 22.0, "creatinine": 0.8, "sodium": 141.0, "calcium": 9.5, "lactic_acid": 0.9,
         "gender": "FEMALE", "encounter_type": "ROUTINE", TARGET_COLUMN: "LOW"},
        # Routine checkup
        {"age": 42.0, "systolic_bp": 122, "diastolic_bp": 78, "heart_rate": 74, "respiratory_rate": 16,
         "body_temperature": 36.9, "oxygen_saturation": 98.0, "glucose_level": 94.0, "cholesterol_total": 185.0,
         "bmi": 24.5, "creatinine": 0.95, "sodium": 139.0, "calcium": 9.3, "lactic_acid": 1.1,
         "gender": "MALE", "encounter_type": "OUTPATIENT", TARGET_COLUMN: "LOW"},

        # Moderate risk - mild hypertension & hyperglycemia
        {"age": 58.0, "systolic_bp": 142, "diastolic_bp": 88, "heart_rate": 88, "respiratory_rate": 20,
         "body_temperature": 37.4, "oxygen_saturation": 95.0, "glucose_level": 145.0, "cholesterol_total": 225.0,
         "bmi": 29.0, "creatinine": 1.3, "sodium": 137.0, "calcium": 9.1, "lactic_acid": 1.8,
         "gender": "MALE", "encounter_type": "OUTPATIENT", TARGET_COLUMN: "MEDIUM"},
        # Moderate risk - borderline tachypnea
        {"age": 64.0, "systolic_bp": 136, "diastolic_bp": 84, "heart_rate": 94, "respiratory_rate": 21,
         "body_temperature": 37.6, "oxygen_saturation": 94.0, "glucose_level": 150.0, "cholesterol_total": 210.0,
         "bmi": 27.5, "creatinine": 1.4, "sodium": 136.0, "calcium": 9.0, "lactic_acid": 2.1,
         "gender": "FEMALE", "encounter_type": "INPATIENT", TARGET_COLUMN: "MEDIUM"},

        # High risk - acute hypertensive urgency & hypoxemia
        {"age": 72.0, "systolic_bp": 168, "diastolic_bp": 102, "heart_rate": 112, "respiratory_rate": 26,
         "body_temperature": 38.5, "oxygen_saturation": 90.5, "glucose_level": 220.0, "cholesterol_total": 245.0,
         "bmi": 32.0, "creatinine": 2.2, "sodium": 132.0, "calcium": 8.5, "lactic_acid": 3.4,
         "gender": "MALE", "encounter_type": "EMERGENCY", TARGET_COLUMN: "HIGH"},
        # High risk - severe hypotension & sepsis suspicion
        {"age": 68.0, "systolic_bp": 92, "diastolic_bp": 58, "heart_rate": 118, "respiratory_rate": 25,
         "body_temperature": 35.8, "oxygen_saturation": 91.0, "glucose_level": 190.0, "cholesterol_total": 230.0,
         "bmi": 30.0, "creatinine": 2.0, "sodium": 133.0, "calcium": 8.7, "lactic_acid": 3.1,
         "gender": "FEMALE", "encounter_type": "EMERGENCY", TARGET_COLUMN: "HIGH"},

        # Critical risk - septic shock profile
        {"age": 78.0, "systolic_bp": 78, "diastolic_bp": 46, "heart_rate": 138, "respiratory_rate": 34,
         "body_temperature": 39.4, "oxygen_saturation": 82.0, "glucose_level": 340.0, "cholesterol_total": 260.0,
         "bmi": 34.0, "creatinine": 4.1, "sodium": 126.0, "calcium": 7.6, "lactic_acid": 6.8,
         "gender": "MALE", "encounter_type": "ICU", TARGET_COLUMN: "CRITICAL"},
        # Critical risk - severe hypoxemic respiratory failure
        {"age": 82.0, "systolic_bp": 195, "diastolic_bp": 118, "heart_rate": 142, "respiratory_rate": 32,
         "body_temperature": 34.6, "oxygen_saturation": 79.0, "glucose_level": 310.0, "cholesterol_total": 270.0,
         "bmi": 33.0, "creatinine": 3.8, "sodium": 128.0, "calcium": 7.9, "lactic_acid": 5.9,
         "gender": "FEMALE", "encounter_type": "ICU", TARGET_COLUMN: "CRITICAL"},
    ]

    df = pd.DataFrame(records)
    GOLDEN_BENCHMARK_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(GOLDEN_BENCHMARK_FILE, index=False)
    return df


class ModelRegressionComparator:
    """
    Compares candidate model vs champion on the golden benchmark dataset.
    """

    def compare_models(
        self,
        champion_pipeline: Any,
        candidate_pipeline: Any,
        golden_df: Optional[pd.DataFrame] = None,
    ) -> Dict[str, Any]:
        """
        Execute deterministic regression test comparison.
        """
        df = golden_df if golden_df is not None else create_or_load_golden_benchmark()
        X = df[FEATURE_NAMES]
        y = df[TARGET_COLUMN]

        eval_champ = evaluate_model(champion_pipeline, X, y)
        eval_cand = evaluate_model(candidate_pipeline, X, y)

        champ_acc = eval_champ["accuracy"]
        cand_acc = eval_cand["accuracy"]
        champ_f1 = eval_champ["f1_macro"]
        cand_f1 = eval_cand["f1_macro"]
        champ_brier = eval_champ.get("brier_score", 1.0) or 1.0
        cand_brier = eval_cand.get("brier_score", 1.0) or 1.0

        # Critical/High sensitivity check
        c_stats_champ = eval_champ.get("clinical_error_impact", {})
        c_stats_cand = eval_cand.get("clinical_error_impact", {})

        champ_missed = c_stats_champ.get("missed_critical_cases", 0) + c_stats_champ.get("missed_high_risk_cases", 0)
        cand_missed = c_stats_cand.get("missed_critical_cases", 0) + c_stats_cand.get("missed_high_risk_cases", 0)

        # Regressed if candidate missed MORE high/critical cases than champion
        has_clinical_regression = cand_missed > champ_missed
        is_promotable = (not has_clinical_regression) and (cand_f1 >= champ_f1 * 0.98)

        verdict = (
            "PASS: Candidate preserves clinical safety and matches champion performance."
            if is_promotable
            else f"FAIL_REGRESSION: Candidate missed {cand_missed} high/critical cases vs {champ_missed} in champion."
        )

        return {
            "verdict": verdict,
            "promotable": is_promotable,
            "has_clinical_regression": has_clinical_regression,
            "champion_metrics": {
                "accuracy": champ_acc,
                "f1_macro": champ_f1,
                "brier_score": champ_brier,
                "missed_high_critical": champ_missed,
                "latency_per_sample_ms": eval_champ.get("latency_per_sample_ms"),
            },
            "candidate_metrics": {
                "accuracy": cand_acc,
                "f1_macro": cand_f1,
                "brier_score": cand_brier,
                "missed_high_critical": cand_missed,
                "latency_per_sample_ms": eval_cand.get("latency_per_sample_ms"),
            },
            "deltas": {
                "accuracy_diff": round(cand_acc - champ_acc, 4),
                "f1_diff": round(cand_f1 - champ_f1, 4),
                "brier_diff": round(cand_brier - champ_brier, 4),
            },
        }
