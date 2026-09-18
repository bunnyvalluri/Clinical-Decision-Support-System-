"""
PredictionRepository — Abstraction and database access layer for predictions and explanations.
"""
from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from apps.clinical.models import ClinicalRecord
from apps.patients.models import Patient
from apps.predictions.models import Prediction, PredictionExplanation
from services.prediction_result import PredictionResult


class IPredictionRepository(ABC):
    """Interface for persisting and querying predictions."""

    @abstractmethod
    def save_prediction(self, result: PredictionResult) -> Prediction:
        """Persist a single prediction and its explanation inside a transaction."""
        pass

    @abstractmethod
    def save_batch(self, results: list[PredictionResult]) -> list[Prediction]:
        """Persist a batch of predictions efficiently."""
        pass

    @abstractmethod
    def get_patient_data(
        self, patient_id: UUID | str, clinical_record_id: UUID | str | None = None
    ) -> tuple[Patient, ClinicalRecord | None, dict[str, Any]]:
        """Retrieve patient entity and clinical vitals dictionary."""
        pass


class DjangoPredictionRepository(IPredictionRepository):
    """PostgreSQL-backed prediction repository leveraging Django ORM."""

    def get_patient_data(
        self, patient_id: UUID | str, clinical_record_id: UUID | str | None = None
    ) -> tuple[Patient, ClinicalRecord | None, dict[str, Any]]:
        try:
            patient = Patient.objects.get(id=patient_id, is_active=True)
        except Patient.DoesNotExist as exc:
            raise ValueError(f"Patient with ID '{patient_id}' does not exist or is inactive.") from exc

        # Calculate patient age from date of birth
        today = timezone.now().date()
        age = (
            today.year
            - patient.date_of_birth.year
            - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
        )

        clinical_record: ClinicalRecord | None = None
        vitals: dict[str, Any] = {}

        if clinical_record_id:
            try:
                clinical_record = ClinicalRecord.objects.get(id=clinical_record_id, patient=patient)
            except ClinicalRecord.DoesNotExist as exc:
                raise ValueError(
                    f"ClinicalRecord with ID '{clinical_record_id}' does not exist for patient '{patient_id}'."
                ) from exc
        else:
            clinical_record = (
                ClinicalRecord.objects.filter(patient=patient).order_by("-recorded_at").first()
            )

        if clinical_record:
            vitals = {
                "systolic_bp": float(clinical_record.systolic_bp) if clinical_record.systolic_bp is not None else 120.0,
                "diastolic_bp": float(clinical_record.diastolic_bp) if clinical_record.diastolic_bp is not None else 80.0,
                "heart_rate": float(clinical_record.heart_rate) if clinical_record.heart_rate is not None else 72.0,
                "respiratory_rate": float(clinical_record.respiratory_rate) if clinical_record.respiratory_rate is not None else 16.0,
                "body_temperature": float(clinical_record.body_temperature) if clinical_record.body_temperature is not None else 37.0,
                "oxygen_saturation": float(clinical_record.oxygen_saturation) if clinical_record.oxygen_saturation is not None else 98.0,
                "glucose_level": float(clinical_record.glucose_level) if clinical_record.glucose_level is not None else 100.0,
                "cholesterol_total": float(clinical_record.cholesterol_total) if clinical_record.cholesterol_total is not None else 200.0,
                "bmi": float(clinical_record.bmi) if clinical_record.bmi is not None else 24.5,
                "creatinine": float(clinical_record.creatinine) if clinical_record.creatinine is not None else 1.0,
                "sodium": float(clinical_record.sodium) if clinical_record.sodium is not None else 140.0,
                "calcium": float(clinical_record.calcium) if clinical_record.calcium is not None else 9.5,
                "lactic_acid": float(clinical_record.lactic_acid) if clinical_record.lactic_acid is not None else 1.0,
            }

        features: dict[str, Any] = {
            "age": age,
            "gender": patient.gender,
            **vitals,
        }

        return patient, clinical_record, features

    @staticmethod
    def _sanitize_json(obj: Any) -> Any:
        import math
        if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
            return None
        if isinstance(obj, dict):
            return {k: DjangoPredictionRepository._sanitize_json(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [DjangoPredictionRepository._sanitize_json(v) for v in obj]
        return obj

    def save_prediction(self, result: PredictionResult) -> Prediction:
        with transaction.atomic():
            prediction = Prediction.objects.create(
                patient_id=result.patient_id,
                clinical_record_id=result.clinical_record_id,
                model_version_id=result.model_version_id,
                model_name=result.model_name,
                model_version_str=result.model_version,
                prediction_result=result.risk_level,
                probability=result.probability,
                confidence_score=result.confidence_score,
                uncertainty_score=result.uncertainty_score,
                is_abstaining=result.is_abstaining,
                ood_status=result.ood_status,
                inference_latency_ms=result.inference_latency_ms,
                feature_schema_version=result.feature_schema_version,
                features_snapshot=self._sanitize_json(result.feature_snapshot),
            )

            if result.explanation:
                PredictionExplanation.objects.create(
                    prediction=prediction,
                    method=result.explanation.method,
                    feature_importances=self._sanitize_json(result.explanation.feature_importances),
                    top_risk_factors=self._sanitize_json(result.explanation.top_risk_factors),
                    baseline_value=result.explanation.baseline_value,
                )

        return prediction

    def save_batch(self, results: list[PredictionResult]) -> list[Prediction]:
        if not results:
            return []

        models_to_create = [
            Prediction(
                patient_id=res.patient_id,
                clinical_record_id=res.clinical_record_id,
                model_version_id=res.model_version_id,
                model_name=res.model_name,
                model_version_str=res.model_version,
                prediction_result=res.risk_level,
                probability=res.probability,
                confidence_score=res.confidence_score,
                uncertainty_score=res.uncertainty_score,
                is_abstaining=res.is_abstaining,
                ood_status=res.ood_status,
                inference_latency_ms=res.inference_latency_ms,
                feature_schema_version=res.feature_schema_version,
                features_snapshot=self._sanitize_json(res.feature_snapshot),
            )
            for res in results
        ]

        with transaction.atomic():
            created = Prediction.objects.bulk_create(models_to_create)

        return created
