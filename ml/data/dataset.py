"""
Clinical dataset generation and management.
Generates a realistic, statistically grounded physiological and biochemical dataset
based on National Early Warning Score (NEWS2) and organ failure risk parameters.
"""
from pathlib import Path
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


def generate_clinical_dataset(n_samples: int = 2500, random_state: int = 42) -> pd.DataFrame:
    """
    Generate a synthetic but medically realistic patient dataset for multi-class risk assessment.
    Simulates physiological vital signs, metabolic markers, and organ function labs across
    four risk categories: LOW, MEDIUM, HIGH, and CRITICAL.
    """
    rng = np.random.default_rng(random_state)
    samples_per_class = n_samples // len(TARGET_CLASSES)
    records = []

    for risk_label in TARGET_CLASSES:
        for _ in range(samples_per_class):
            gender = rng.choice(["MALE", "FEMALE", "OTHER", "UNKNOWN"], p=[0.48, 0.48, 0.03, 0.01])

            if risk_label == "LOW":
                age = float(rng.integers(18, 65))
                encounter = rng.choice(["ROUTINE", "OUTPATIENT"], p=[0.7, 0.3])
                systolic = float(rng.normal(118, 8))
                diastolic = float(rng.normal(76, 6))
                hr = float(rng.normal(72, 8))
                rr = float(rng.normal(16, 2))
                temp = float(rng.normal(36.8, 0.3))
                spo2 = float(np.clip(rng.normal(98.5, 1.0), 95.0, 100.0))
                glucose = float(rng.normal(92, 12))
                cholesterol = float(rng.normal(180, 25))
                bmi = float(rng.normal(23.5, 3.0))
                creatinine = float(rng.normal(0.9, 0.15))
                sodium = float(rng.normal(140.0, 2.0))
                calcium = float(rng.normal(9.4, 0.4))
                lactate = float(rng.normal(1.1, 0.3))

            elif risk_label == "MEDIUM":
                age = float(rng.integers(35, 75))
                encounter = rng.choice(["OUTPATIENT", "INPATIENT"], p=[0.6, 0.4])
                systolic = float(rng.normal(138, 12))
                diastolic = float(rng.normal(88, 8))
                hr = float(rng.normal(92, 10))
                rr = float(rng.normal(20, 3))
                temp = float(rng.normal(37.5, 0.6))
                spo2 = float(np.clip(rng.normal(95.0, 1.5), 92.0, 99.0))
                glucose = float(rng.normal(140, 25))
                cholesterol = float(rng.normal(220, 35))
                bmi = float(rng.normal(28.0, 4.0))
                creatinine = float(rng.normal(1.3, 0.25))
                sodium = float(rng.normal(137.0, 3.0))
                calcium = float(rng.normal(9.1, 0.5))
                lactate = float(rng.normal(1.9, 0.4))

            elif risk_label == "HIGH":
                age = float(rng.integers(45, 85))
                encounter = rng.choice(["INPATIENT", "EMERGENCY"], p=[0.4, 0.6])
                # Tendency towards severe hypertension or moderate hypotension
                systolic = float(rng.choice([rng.normal(165, 15), rng.normal(92, 6)]))
                diastolic = float(rng.choice([rng.normal(102, 10), rng.normal(58, 5)]))
                hr = float(rng.normal(112, 12))
                rr = float(rng.normal(25, 4))
                temp = float(rng.choice([rng.normal(38.6, 0.7), rng.normal(35.8, 0.4)]))
                spo2 = float(np.clip(rng.normal(91.0, 2.0), 85.0, 95.0))
                glucose = float(rng.normal(210, 45))
                cholesterol = float(rng.normal(245, 40))
                bmi = float(rng.normal(31.5, 5.0))
                creatinine = float(rng.normal(2.1, 0.4))
                sodium = float(rng.normal(133.0, 4.0))
                calcium = float(rng.normal(8.5, 0.6))
                lactate = float(rng.normal(3.2, 0.6))

            else:  # CRITICAL
                age = float(rng.integers(50, 90))
                encounter = rng.choice(["EMERGENCY", "ICU"], p=[0.3, 0.7])
                systolic = float(rng.choice([rng.normal(190, 20), rng.normal(78, 8)]))
                diastolic = float(rng.choice([rng.normal(115, 12), rng.normal(48, 6)]))
                hr = float(rng.choice([rng.normal(138, 14), rng.normal(42, 5)]))  # extreme tachy or brady
                rr = float(rng.normal(32, 5))
                temp = float(rng.choice([rng.normal(39.4, 0.8), rng.normal(34.8, 0.6)]))
                spo2 = float(np.clip(rng.normal(84.0, 3.5), 65.0, 90.0))
                glucose = float(rng.normal(320, 80))
                cholesterol = float(rng.normal(260, 50))
                bmi = float(rng.normal(33.0, 6.0))
                creatinine = float(rng.normal(3.8, 0.9))
                sodium = float(rng.normal(128.0, 5.0))
                calcium = float(rng.normal(7.8, 0.8))
                lactate = float(rng.normal(5.8, 1.4))

            # Ensure systolic > diastolic
            if systolic <= diastolic:
                systolic = diastolic + 15.0

            # Realistic simulated missing values for select lab panels (3-6% missing)
            if rng.random() < 0.05:
                calcium = np.nan
            if rng.random() < 0.05:
                cholesterol = np.nan
            if rng.random() < 0.03:
                sodium = np.nan

            records.append(
                {
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
                }
            )

    df = pd.DataFrame(records)
    # Shuffle records
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
