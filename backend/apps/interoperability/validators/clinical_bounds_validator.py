"""
Clinical Physiological Bounds Validator — BPY-CSE-2666.
Ensures incoming observational vitals and laboratory values are physiologically plausible
before they are admitted into internal clinical models or ML inference pipelines.
"""
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from apps.interoperability.domain.exceptions import ClinicalBoundsViolationError


class ClinicalBoundsValidator:
    """
    Validates clinical observations against established physiological reference bounds.
    """

    # Feature Name -> (Min Plausible, Max Plausible, Unit, Display Name)
    PHYSIOLOGICAL_BOUNDS: Dict[str, Tuple[float, float, str, str]] = {
        "systolic_bp": (40.0, 300.0, "mmHg", "Systolic Blood Pressure"),
        "diastolic_bp": (20.0, 200.0, "mmHg", "Diastolic Blood Pressure"),
        "heart_rate": (20.0, 300.0, "bpm", "Heart Rate"),
        "respiratory_rate": (4.0, 80.0, "/min", "Respiratory Rate"),
        "body_temperature": (28.0, 45.0, "°C", "Body Temperature"),
        "oxygen_saturation": (40.0, 100.0, "%", "Pulse Oximetry SpO2"),
        "glucose_level": (10.0, 1500.0, "mg/dL", "Blood Glucose"),
        "cholesterol_total": (50.0, 1000.0, "mg/dL", "Total Cholesterol"),
        "bmi": (10.0, 100.0, "kg/m²", "Body Mass Index"),
        "creatinine": (0.1, 30.0, "mg/dL", "Serum Creatinine"),
        "sodium": (100.0, 180.0, "mmol/L", "Serum Sodium"),
        "calcium": (3.0, 20.0, "mg/dL", "Serum Calcium"),
        "lactic_acid": (0.2, 30.0, "mmol/L", "Serum Lactic Acid"),
    }

    @classmethod
    def validate_clinical_dict(cls, data: Dict[str, Any], raise_exception: bool = False) -> List[Dict[str, Any]]:
        """
        Validates a dictionary of extracted clinical features.
        Returns a list of violation dictionaries:
        [{
            "feature": "systolic_bp",
            "value": 350,
            "min": 40.0,
            "max": 300.0,
            "unit": "mmHg",
            "message": "..."
        }]
        """
        violations: List[Dict[str, Any]] = []

        for feature_name, bounds in cls.PHYSIOLOGICAL_BOUNDS.items():
            if feature_name in data and data[feature_name] is not None:
                val = data[feature_name]
                try:
                    num_val = float(val) if not isinstance(val, (int, float, Decimal)) else float(val)
                except (ValueError, TypeError):
                    continue

                min_val, max_val, unit, display_name = bounds
                if num_val < min_val or num_val > max_val:
                    violation = {
                        "feature": feature_name,
                        "display_name": display_name,
                        "value": num_val,
                        "min": min_val,
                        "max": max_val,
                        "unit": unit,
                        "message": (
                            f"{display_name} value of {num_val} {unit} is outside physiologically plausible "
                            f"bounds ({min_val} - {max_val} {unit})."
                        ),
                    }
                    violations.append(violation)
                    if raise_exception:
                        raise ClinicalBoundsViolationError(
                            message=violation["message"],
                            feature_name=feature_name,
                            value=num_val,
                            safe_range=(min_val, max_val),
                        )

        # Check systolic > diastolic relationship
        sys_bp = data.get("systolic_bp")
        dia_bp = data.get("diastolic_bp")
        if sys_bp is not None and dia_bp is not None:
            try:
                if float(sys_bp) <= float(dia_bp):
                    violation = {
                        "feature": "blood_pressure_inversion",
                        "display_name": "Blood Pressure Relationship",
                        "value": f"{sys_bp}/{dia_bp}",
                        "message": f"Systolic blood pressure ({sys_bp}) must exceed diastolic pressure ({dia_bp}).",
                    }
                    violations.append(violation)
                    if raise_exception:
                        raise ClinicalBoundsViolationError(
                            message=violation["message"],
                            feature_name="blood_pressure_inversion",
                            value=f"{sys_bp}/{dia_bp}",
                        )
            except (ValueError, TypeError):
                pass

        return violations
