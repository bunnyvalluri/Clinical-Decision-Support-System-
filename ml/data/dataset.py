"""
Clinical dataset generation and management.
Generates a realistic, statistically grounded physiological and biochemical dataset
based on National Early Warning Score (NEWS2) and organ failure risk parameters.
Supports patient-level grouped records to evaluate and prevent data leakage across splits.
"""
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd

from ml.features.schema import (
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    TARGET_CLASSES,
    TARGET_COLUMN,
)

DATA_DIR = Path(__file__).resolve().parent
DATASET_PATH = DATA_DIR / "patient_risk_dataset.csv"


def generate_clinical_dataset(
    n_samples: int = 2500,
    n_unique_patients: int = 1200,
    imbalanced: bool = True,
    random_state: int = 42,
) -> pd.DataFrame:
    """
    Generate a synthetic, medically realistic patient dataset for multi-class risk assessment.
    Features:
    - Patient-level grouping (multiple encounters per patient for longitudinal modeling)
    - Realistic clinical class distribution (LOW 45%, MEDIUM 30%, HIGH 17%, CRITICAL 8% by default)
    - Physiological correlations and realistic clinical boundary overlap
    - Controlled, non-trivial missingness in elective laboratory panels
    """
    rng = np.random.default_rng(random_state)

    # Class probabilities reflecting typical acute/triage distribution
    if imbalanced:
        class_probs = [0.45, 0.30, 0.17, 0.08]
    else:
        class_probs = [0.25, 0.25, 0.25, 0.25]

    # Pre-generate unique patient cohort baseline demographics
    patients = []
    for i in range(n_unique_patients):
        p_id = f"PT-{i + 10001:05d}"
        p_gender = rng.choice(["MALE", "FEMALE", "OTHER", "UNKNOWN"], p=[0.48, 0.48, 0.03, 0.01])
        base_age = float(rng.integers(18, 88))
        base_bmi = float(rng.normal(27.0, 5.0))
        base_bmi = float(np.clip(base_bmi, 15.0, 55.0))
        patients.append({
            "patient_id": p_id,
            "gender": p_gender,
            "base_age": base_age,
            "base_bmi": base_bmi,
        })

    records = []
    encounters_per_patient = max(1, n_samples // n_unique_patients)
    remaining_samples = n_samples

    for p in patients:
        # Each patient has 1 to 3 visits
        num_visits = rng.choice([1, 2, 3], p=[0.60, 0.30, 0.10])
        num_visits = min(num_visits, remaining_samples)
        if num_visits == 0:
            break

        for visit_idx in range(num_visits):
            risk_label = rng.choice(TARGET_CLASSES, p=class_probs)
            age = float(np.clip(p["base_age"] + (visit_idx * 0.5), 18.0, 105.0))
            bmi = float(np.clip(p["base_bmi"] + rng.normal(0, 0.5), 15.0, 58.0))
            gender = p["gender"]

            if risk_label == "LOW":
                encounter = rng.choice(["ROUTINE", "OUTPATIENT"], p=[0.7, 0.3])
                systolic = float(rng.normal(120, 10))
                diastolic = float(rng.normal(78, 7))
                hr = float(rng.normal(72, 9))
                rr = float(rng.normal(16, 2))
                temp = float(rng.normal(36.8, 0.3))
                spo2 = float(np.clip(rng.normal(98.2, 1.2), 94.0, 100.0))
                glucose = float(rng.normal(95, 15))
                cholesterol = float(rng.normal(185, 28))
                creatinine = float(np.clip(rng.normal(0.9, 0.18), 0.5, 1.3))
                sodium = float(rng.normal(140.0, 2.2))
                calcium = float(rng.normal(9.4, 0.4))
                lactate = float(np.clip(rng.normal(1.1, 0.3), 0.5, 1.9))

            elif risk_label == "MEDIUM":
                encounter = rng.choice(["OUTPATIENT", "INPATIENT"], p=[0.6, 0.4])
                systolic = float(rng.normal(138, 14))
                diastolic = float(rng.normal(88, 9))
                hr = float(rng.normal(90, 12))
                rr = float(rng.normal(20, 3))
                temp = float(rng.normal(37.4, 0.6))
                spo2 = float(np.clip(rng.normal(95.0, 2.0), 91.0, 99.0))
                glucose = float(rng.normal(138, 28))
                cholesterol = float(rng.normal(218, 35))
                creatinine = float(np.clip(rng.normal(1.3, 0.28), 0.9, 2.0))
                sodium = float(rng.normal(137.0, 3.2))
                calcium = float(rng.normal(9.1, 0.5))
                lactate = float(np.clip(rng.normal(1.8, 0.4), 1.2, 2.4))

            elif risk_label == "HIGH":
                encounter = rng.choice(["INPATIENT", "EMERGENCY"], p=[0.35, 0.65])
                # Tendency towards high or low BP with realistic clinical overlap
                systolic = float(rng.choice([rng.normal(162, 16), rng.normal(94, 8)]))
                diastolic = float(rng.choice([rng.normal(98, 11), rng.normal(60, 6)]))
                hr = float(rng.normal(110, 14))
                rr = float(rng.normal(25, 4))
                temp = float(rng.choice([rng.normal(38.4, 0.7), rng.normal(35.9, 0.5)]))
                spo2 = float(np.clip(rng.normal(91.5, 2.5), 84.0, 96.0))
                glucose = float(rng.normal(205, 48))
                cholesterol = float(rng.normal(240, 42))
                creatinine = float(np.clip(rng.normal(2.1, 0.5), 1.4, 3.5))
                sodium = float(rng.normal(133.0, 4.2))
                calcium = float(rng.normal(8.6, 0.6))
                lactate = float(np.clip(rng.normal(3.1, 0.7), 2.1, 4.5))

            else:  # CRITICAL
                encounter = rng.choice(["EMERGENCY", "ICU"], p=[0.25, 0.75])
                systolic = float(rng.choice([rng.normal(185, 22), rng.normal(80, 9)]))
                diastolic = float(rng.choice([rng.normal(112, 14), rng.normal(50, 7)]))
                hr = float(rng.choice([rng.normal(135, 16), rng.normal(44, 6)]))
                rr = float(rng.normal(31, 5))
                temp = float(rng.choice([rng.normal(39.2, 0.8), rng.normal(34.9, 0.7)]))
                spo2 = float(np.clip(rng.normal(84.5, 4.0), 65.0, 91.0))
                glucose = float(rng.normal(310, 85))
                cholesterol = float(rng.normal(255, 52))
                creatinine = float(np.clip(rng.normal(3.7, 1.0), 2.2, 7.5))
                sodium = float(rng.normal(128.0, 5.5))
                calcium = float(rng.normal(7.9, 0.8))
                lactate = float(np.clip(rng.normal(5.6, 1.5), 3.8, 12.0))

            # Strictly enforce physiological law: systolic > diastolic
            if systolic <= diastolic:
                systolic = diastolic + float(rng.uniform(15.0, 30.0))

            # Realistic clinical missingness in secondary panels (3-6%)
            if rng.random() < 0.05:
                calcium = np.nan
            if rng.random() < 0.05:
                cholesterol = np.nan
            if rng.random() < 0.03:
                sodium = np.nan

            records.append({
                "patient_id": p["patient_id"],
                "age": round(age, 1),
                "systolic_bp": int(round(systolic)),
                "diastolic_bp": int(round(diastolic)),
                "heart_rate": int(round(hr)),
                "respiratory_rate": int(round(rr)),
                "body_temperature": round(temp, 1),
                "oxygen_saturation": round(spo2, 1),
                "glucose_level": round(glucose, 1),
                "cholesterol_total": round(cholesterol, 1) if not np.isnan(cholesterol) else None,
                "bmi": round(bmi, 1),
                "creatinine": round(creatinine, 2),
                "sodium": round(sodium, 1) if not np.isnan(sodium) else None,
                "calcium": round(calcium, 1) if not np.isnan(calcium) else None,
                "lactic_acid": round(lactate, 2),
                "gender": gender,
                "encounter_type": encounter,
                TARGET_COLUMN: risk_label,
            })
            remaining_samples -= 1

    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df


def get_or_create_dataset(force_recreate: bool = False) -> pd.DataFrame:
    """
    Load cached dataset if available; otherwise generate and persist to disk.
    """
    if DATASET_PATH.exists() and not force_recreate:
        return pd.read_csv(DATASET_PATH)

    df = generate_clinical_dataset()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATASET_PATH, index=False)
    return df
