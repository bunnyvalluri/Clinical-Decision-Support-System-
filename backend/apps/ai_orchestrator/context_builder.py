"""
Clinical Data Minimization and Context Builder.
Enforces the HIPAA / GDPR Minimum Necessary Standard by extracting only
relevant physiological and prognostic parameters, stripping identifiable patient
details (full name, phone, email, address) before multi-agent reasoning.
"""
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
from typing import Any, Dict, List, Optional
import uuid

from apps.clinical.models import ClinicalRecord
from apps.patients.models import Patient


@dataclass(frozen=True)
class MinimizedClinicalContext:
    pseudonymous_id: str
    age: int
    gender: str
    vitals_summary: List[Dict[str, Any]]
    latest_observations: Dict[str, Optional[float]]
    active_risk_factors: List[str]
    context_created_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ClinicalRiskContextBuilder:
    """
    Constructs bounded, de-identified clinical contexts for agent reasoning.
    Limits observation history to the latest 5 physiological records.
    """

    MAX_HISTORICAL_RECORDS = 5

    @classmethod
    def generate_pseudonym(cls, patient_id: uuid.UUID, salt: str = "healthnova_v3") -> str:
        digest = hashlib.sha256(f"{patient_id}:{salt}".encode("utf-8")).hexdigest()
        return f"SUBJ-{digest[:8].upper()}"

    @classmethod
    def build_context(cls, patient: Patient) -> MinimizedClinicalContext:
        pseudonym = cls.generate_pseudonym(patient.id)

        records = (
            ClinicalRecord.objects.filter(patient=patient)
            .order_by("-recorded_at")[: cls.MAX_HISTORICAL_RECORDS]
        )

        vitals_list: List[Dict[str, Any]] = []
        latest_obs: Dict[str, Optional[float]] = {
            "systolic_bp": None,
            "diastolic_bp": None,
            "heart_rate": None,
            "respiratory_rate": None,
            "temperature": None,
            "oxygen_saturation": None,
            "glucose": None,
            "creatinine": None,
            "potassium": None,
            "lactic_acid": None,
        }

        active_risk_factors: List[str] = []

        for idx, rec in enumerate(records):
            temp_val = getattr(rec, "body_temperature", None) or getattr(rec, "temperature", None)
            glucose_val = getattr(rec, "glucose_level", None) or getattr(rec, "glucose", None)
            potassium_val = getattr(rec, "potassium", None)
            if potassium_val is None and isinstance(getattr(rec, "lab_results", None), dict):
                potassium_val = rec.lab_results.get("potassium")

            vitals_entry = {
                "sequence": idx + 1,
                "recorded_at": rec.recorded_at.isoformat() if rec.recorded_at else None,
                "systolic_bp": float(rec.systolic_bp) if rec.systolic_bp is not None else None,
                "diastolic_bp": float(rec.diastolic_bp) if rec.diastolic_bp is not None else None,
                "heart_rate": rec.heart_rate,
                "respiratory_rate": rec.respiratory_rate,
                "temperature": float(temp_val) if temp_val is not None else None,
                "oxygen_saturation": float(rec.oxygen_saturation) if rec.oxygen_saturation is not None else None,
                "glucose": float(glucose_val) if glucose_val is not None else None,
                "creatinine": float(rec.creatinine) if rec.creatinine is not None else None,
                "potassium": float(potassium_val) if potassium_val is not None else None,
                "lactic_acid": float(rec.lactic_acid) if rec.lactic_acid is not None else None,
            }
            vitals_list.append(vitals_entry)

            if idx == 0:
                for k in latest_obs:
                    latest_obs[k] = vitals_entry.get(k)

        # Flag common biological thresholds
        if latest_obs["systolic_bp"] and latest_obs["systolic_bp"] >= 160:
            active_risk_factors.append("Severe Systolic Hypertension")
        if latest_obs["heart_rate"] and latest_obs["heart_rate"] >= 100:
            active_risk_factors.append("Tachycardia")
        if latest_obs["respiratory_rate"] and latest_obs["respiratory_rate"] >= 22:
            active_risk_factors.append("Tachypnea (qSOFA criteria)")
        if latest_obs["lactic_acid"] and latest_obs["lactic_acid"] >= 2.0:
            active_risk_factors.append("Hyperlactatemia")
        if latest_obs["oxygen_saturation"] and latest_obs["oxygen_saturation"] < 92:
            active_risk_factors.append("Hypoxia")

        return MinimizedClinicalContext(
            pseudonymous_id=pseudonym,
            age=patient.age,
            gender=str(patient.gender),
            vitals_summary=vitals_list,
            latest_observations=latest_obs,
            active_risk_factors=active_risk_factors,
            context_created_at=datetime.now(timezone.utc).isoformat(),
        )
