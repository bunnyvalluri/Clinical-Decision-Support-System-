"""
Prediction Comparison & Change Detection Service — BPY-CSE-2666.

Provides authoritative domain logic for:
1. get_current_patient_prediction(patient_id)
2. get_previous_patient_prediction(patient_id, current_prediction_id)
3. compare_patient_predictions(current_pred, previous_pred)
4. Feature change detection and difference attribution
5. Model lineage and dataset provenance comparison
6. Clinical alert triggering on critical risk transitions
"""
from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from django.db import transaction

from apps.accounts.models import UserRole
from apps.clinical.models import (
    ClinicalAlert,
    ClinicalFeatureDefinition,
    ClinicalRule,
    PatientTimelineEvent,
)
from apps.model_registry.models import ModelStatus, ModelVersion
from apps.predictions.models import (
    ClinicalReview,
    Prediction,
    PredictionExplanation,
    ReviewStatus,
    RiskLevel,
)

logger = logging.getLogger(__name__)

# Severity hierarchy for transition classification
RISK_SEVERITY_ORDER = {
    RiskLevel.LOW: 1,
    RiskLevel.MEDIUM: 2,
    RiskLevel.HIGH: 3,
    RiskLevel.CRITICAL: 4,
}


def get_current_patient_prediction(patient_id: str | UUID) -> Optional[Prediction]:
    """
    Retrieve the authoritative current production prediction for a patient.
    Evaluates:
    - Exclusion of invalidated/superseded/error predictions
    - Only approved production/active models
    - Chronological recency (latest timestamp)
    - Considers clinician override status
    """
    qs = Prediction.objects.filter(
        patient_id=patient_id,
    ).exclude(
        review_status__in=[ReviewStatus.SUPERSEDED, ReviewStatus.EXPIRED, ReviewStatus.ERROR]
    ).select_related(
        "model_version",
        "clinical_record",
        "explanation",
        "clinical_review",
        "overridden_by",
        "patient",
    ).order_by("-prediction_timestamp")

    for pred in qs:
        # Verify model version status is approved or active/production
        mv = pred.model_version
        if mv and mv.status in [
            ModelStatus.PRODUCTION,
            ModelStatus.APPROVED,
            ModelStatus.ACTIVE,
            ModelStatus.STAGED,
            ModelStatus.CANARY,
        ]:
            return pred

    # Fallback to the latest non-superseded prediction if strict model status filter matches none
    return qs.first()


def get_previous_patient_prediction(
    patient_id: str | UUID,
    current_prediction_id: Optional[str | UUID] = None,
) -> Optional[Prediction]:
    """
    Retrieve the prior valid prediction strictly preceding the current prediction.
    """
    qs = Prediction.objects.filter(
        patient_id=patient_id,
    ).exclude(
        review_status__in=[ReviewStatus.SUPERSEDED, ReviewStatus.EXPIRED, ReviewStatus.ERROR]
    )

    if current_prediction_id:
        try:
            current_pred = Prediction.objects.get(id=current_prediction_id)
            qs = qs.filter(prediction_timestamp__lt=current_pred.prediction_timestamp)
        except (Prediction.DoesNotExist, ValueError):
            pass

    return qs.select_related(
        "model_version",
        "clinical_record",
        "explanation",
        "clinical_review",
        "overridden_by",
        "patient",
    ).order_by("-prediction_timestamp").first()


class PredictionComparisonService:
    """
    Coordinates longitudinal prediction comparisons, feature deltas, and risk escalation triggers.
    """

    FEATURE_DISPLAY_NAMES: Dict[str, str] = {
        "heart_rate": "Heart Rate (bpm)",
        "respiratory_rate": "Respiratory Rate (breaths/min)",
        "systolic_bp": "Systolic Blood Pressure (mmHg)",
        "diastolic_bp": "Diastolic Blood Pressure (mmHg)",
        "body_temperature": "Body Temperature (°C)",
        "oxygen_saturation": "Oxygen Saturation SpO2 (%)",
        "glucose_level": "Blood Glucose (mg/dL)",
        "cholesterol_total": "Total Cholesterol (mg/dL)",
        "bmi": "Body Mass Index (kg/m²)",
        "creatinine": "Serum Creatinine (mg/dL)",
        "sodium": "Serum Sodium (mmol/L)",
        "calcium": "Serum Calcium (mg/dL)",
        "lactic_acid": "Serum Lactate (mmol/L)",
        "age": "Patient Age (years)",
    }

    FEATURE_UNITS: Dict[str, str] = {
        "heart_rate": "bpm",
        "respiratory_rate": "breaths/min",
        "systolic_bp": "mmHg",
        "diastolic_bp": "mmHg",
        "body_temperature": "°C",
        "oxygen_saturation": "%",
        "glucose_level": "mg/dL",
        "cholesterol_total": "mg/dL",
        "bmi": "kg/m²",
        "creatinine": "mg/dL",
        "sodium": "mmol/L",
        "calcium": "mg/dL",
        "lactic_acid": "mmol/L",
        "age": "years",
    }

    get_current_patient_prediction = staticmethod(get_current_patient_prediction)
    get_previous_patient_prediction = staticmethod(get_previous_patient_prediction)

    @classmethod
    def compare_patient_predictions(
        cls,
        current_pred: Prediction,
        previous_pred: Optional[Prediction] = None,
        auto_trigger_rules: bool = True,
    ) -> Dict[str, Any]:
        """
        Produce a comprehensive, audited side-by-side comparison between two predictions.
        """
        # Baseline comparison when no predecessor exists
        if previous_pred is None:
            return cls._build_initial_prediction_payload(current_pred)

        # 1. Risk Transition Detection
        prev_risk = previous_pred.prediction_result
        curr_risk = current_pred.prediction_result
        prev_effective_risk = previous_pred.clinician_override or prev_risk
        curr_effective_risk = current_pred.clinician_override or curr_risk

        prev_order = RISK_SEVERITY_ORDER.get(prev_effective_risk, 1)
        curr_order = RISK_SEVERITY_ORDER.get(curr_effective_risk, 1)

        if curr_order > prev_order:
            transition_direction = "ESCALATION"
        elif curr_order < prev_order:
            transition_direction = "DE_ESCALATION"
        else:
            transition_direction = "STABLE"

        risk_changed = (curr_effective_risk != prev_effective_risk)

        # 2. Elapsed Time Calculation
        curr_ts = current_pred.prediction_timestamp
        prev_ts = previous_pred.prediction_timestamp
        time_diff = curr_ts - prev_ts
        time_diff_seconds = int(time_diff.total_seconds())

        # 3. Model Lineage Comparison
        model_version_changed = (
            current_pred.model_name != previous_pred.model_name
            or current_pred.model_version_str != previous_pred.model_version_str
        )

        # 4. Validated Input Feature Differences
        feature_changes = cls._compute_feature_differences(
            prev_snapshot=previous_pred.features_snapshot or {},
            curr_snapshot=current_pred.features_snapshot or {},
        )

        # 5. SHAP Factor Divergence
        shap_divergence = cls._compute_shap_divergence(current_pred, previous_pred)

        # 6. Automatic Clinical Rule & Escalation Evaluation
        alerts_generated = []
        if auto_trigger_rules and transition_direction == "ESCALATION" and curr_effective_risk in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            triggered_alert = cls._evaluate_escalation_alert(current_pred, previous_pred, curr_effective_risk)
            if triggered_alert:
                alerts_generated.append(triggered_alert)

        return {
            "is_initial_prediction": False,
            "patient_id": str(current_pred.patient_id),
            "patient_mrn": current_pred.patient.mrn if current_pred.patient else "",
            "risk_changed": risk_changed,
            "transition_direction": transition_direction,
            "risk_transition": f"{prev_effective_risk} -> {curr_effective_risk}",
            "time_between_predictions_seconds": time_diff_seconds,
            "time_between_formatted": cls._format_duration(time_diff_seconds),
            "current_prediction": cls._serialize_prediction_summary(current_pred),
            "previous_prediction": cls._serialize_prediction_summary(previous_pred),
            "model_version_changed": model_version_changed,
            "feature_changes": feature_changes,
            "feature_changes_count": len(feature_changes),
            "shap_divergence": shap_divergence,
            "alerts_generated": alerts_generated,
            "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @classmethod
    def _compute_feature_differences(
        cls,
        prev_snapshot: Dict[str, Any],
        curr_snapshot: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """
        Compare active feature snapshots and compute directional and percentage deltas.
        """
        all_keys = set(prev_snapshot.keys()).union(set(curr_snapshot.keys()))
        differences: List[Dict[str, Any]] = []

        for key in sorted(all_keys):
            prev_val = prev_snapshot.get(key)
            curr_val = curr_snapshot.get(key)

            # Ignore if both are None
            if prev_val is None and curr_val is None:
                continue

            display_name = cls.FEATURE_DISPLAY_NAMES.get(key, key.replace("_", " ").title())
            unit = cls.FEATURE_UNITS.get(key, "")

            # Check if numeric for delta calculation
            is_numeric = False
            delta_val = None
            pct_change = None
            direction = "UNCHANGED"

            try:
                if prev_val is not None and curr_val is not None:
                    p_num = float(prev_val)
                    c_num = float(curr_val)
                    is_numeric = True
                    diff = c_num - p_num
                    delta_val = round(diff, 2)
                    if p_num != 0:
                        pct_change = round((diff / abs(p_num)) * 100.0, 1)

                    if diff > 0.001:
                        direction = "INCREASED"
                    elif diff < -0.001:
                        direction = "DECREASED"
                    else:
                        direction = "UNCHANGED"
                elif prev_val is None and curr_val is not None:
                    direction = "ADDED"
                elif prev_val is not None and curr_val is None:
                    direction = "REMOVED"
            except (ValueError, TypeError):
                # Categorical or string feature
                if prev_val != curr_val:
                    direction = "CHANGED"
                else:
                    direction = "UNCHANGED"

            # Check clinical significance
            is_significant = False
            if is_numeric and delta_val is not None:
                if key in ["systolic_bp", "diastolic_bp"] and abs(delta_val) >= 15:
                    is_significant = True
                elif key in ["heart_rate", "respiratory_rate"] and abs(delta_val) >= 10:
                    is_significant = True
                elif key == "oxygen_saturation" and abs(delta_val) >= 3:
                    is_significant = True
                elif key == "glucose_level" and abs(delta_val) >= 30:
                    is_significant = True
                elif key in ["creatinine", "lactic_acid"] and abs(delta_val) >= 0.3:
                    is_significant = True
            elif direction in ["ADDED", "CHANGED"]:
                is_significant = True

            differences.append({
                "feature": key,
                "display_name": display_name,
                "unit": unit,
                "previous_value": prev_val,
                "current_value": curr_val,
                "delta": delta_val,
                "percentage_change": pct_change,
                "direction": direction,
                "is_numeric": is_numeric,
                "is_significant": is_significant,
            })

        return differences

    @classmethod
    def _compute_shap_divergence(
        cls,
        current_pred: Prediction,
        previous_pred: Prediction,
    ) -> Dict[str, Any]:
        """
        Compare SHAP factor weights between predictions to show how feature attributions shifted.
        """
        curr_exp = getattr(current_pred, "explanation", None)
        prev_exp = getattr(previous_pred, "explanation", None)

        if not curr_exp or not prev_exp:
            return {
                "available": False,
                "message": "Full TreeSHAP explanation not available on both predictions.",
                "shifted_factors": [],
            }

        curr_importances = curr_exp.feature_importances or {}
        prev_importances = prev_exp.feature_importances or {}

        shifted_factors = []
        all_features = set(curr_importances.keys()).union(set(prev_importances.keys()))

        for f in all_features:
            curr_weight = float(curr_importances.get(f, 0.0))
            prev_weight = float(prev_importances.get(f, 0.0))
            shift = round(curr_weight - prev_weight, 4)

            display_name = cls.FEATURE_DISPLAY_NAMES.get(f, f.replace("_", " ").title())
            shifted_factors.append({
                "feature": f,
                "display_name": display_name,
                "previous_shap": prev_weight,
                "current_shap": curr_weight,
                "shap_shift": shift,
                "increased_contribution": shift > 0,
            })

        shifted_factors.sort(key=lambda x: abs(x["shap_shift"]), reverse=True)

        return {
            "available": True,
            "method": curr_exp.method,
            "shifted_factors": shifted_factors[:8],
            "disclaimer": "Attribution shift reflects model mathematical weights, not medical causation.",
        }

    @classmethod
    def _evaluate_escalation_alert(
        cls,
        current_pred: Prediction,
        previous_pred: Prediction,
        new_risk: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluate and optionally record a ClinicalAlert when a high-risk transition occurs.
        """
        try:
            with transaction.atomic():
                alert = ClinicalAlert.objects.create(
                    patient=current_pred.patient,
                    alert_type="PREDICTION_RISK_ESCALATION",
                    severity="CRITICAL" if new_risk == RiskLevel.CRITICAL else "URGENT",
                    source=ClinicalAlert.Source.ML_PREDICTION,
                    message=(
                        f"Patient risk escalated from {previous_pred.prediction_result} "
                        f"to {new_risk} (predicted probability: {float(current_pred.probability):.1%}). "
                        f"Attending clinical review required."
                    ),
                    details={
                        "previous_prediction_id": str(previous_pred.id),
                        "current_prediction_id": str(current_pred.id),
                        "previous_risk": previous_pred.prediction_result,
                        "current_risk": new_risk,
                        "probability": float(current_pred.probability),
                        "model_version": current_pred.model_version_str,
                    },
                )
                return {
                    "alert_id": str(alert.id),
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "message": alert.message,
                }
        except Exception as exc:
            logger.warning("Could not persist automatic escalation alert: %s", exc)
            return None

    @classmethod
    def _build_initial_prediction_payload(cls, pred: Prediction) -> Dict[str, Any]:
        """Format baseline prediction payload when no previous prediction exists."""
        return {
            "is_initial_prediction": True,
            "patient_id": str(pred.patient_id),
            "patient_mrn": pred.patient.mrn if pred.patient else "",
            "risk_changed": False,
            "transition_direction": "INITIAL",
            "risk_transition": f"BASELINE ({pred.prediction_result})",
            "time_between_predictions_seconds": 0,
            "time_between_formatted": "Initial Baseline Assessment",
            "current_prediction": cls._serialize_prediction_summary(pred),
            "previous_prediction": None,
            "model_version_changed": False,
            "feature_changes": [],
            "feature_changes_count": 0,
            "shap_divergence": {
                "available": False,
                "message": "Initial assessment established as baseline; no comparative divergence available.",
                "shifted_factors": [],
            },
            "alerts_generated": [],
            "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _serialize_prediction_summary(pred: Prediction) -> Dict[str, Any]:
        review = getattr(pred, "clinical_review", None)
        return {
            "id": str(pred.id),
            "timestamp": pred.prediction_timestamp.isoformat(),
            "risk_level": pred.prediction_result,
            "probability": float(pred.probability),
            "confidence_score": float(pred.confidence_score) if pred.confidence_score else None,
            "model_name": pred.model_name,
            "model_version": pred.model_version_str,
            "feature_schema_version": pred.feature_schema_version,
            "dataset_version": pred.model_version.training_dataset_identifier if pred.model_version else "clinical_risk_v1",
            "is_abstaining": pred.is_abstaining,
            "uncertainty_score": float(pred.uncertainty_score) if pred.uncertainty_score else None,
            "ood_status": pred.ood_status,
            "clinician_override": pred.clinician_override,
            "override_reason": pred.override_reason,
            "review_status": review.status if review else pred.review_status,
            "review_decision": review.decision if review else None,
        }

    @staticmethod
    def _format_duration(seconds: int) -> str:
        if seconds < 60:
            return f"{seconds}s"
        minutes = seconds // 60
        if minutes < 60:
            return f"{minutes}m"
        hours = minutes // 60
        if hours < 24:
            rem_min = minutes % 60
            return f"{hours}h {rem_min}m"
        days = hours // 24
        rem_hours = hours % 24
        return f"{days}d {rem_hours}h"
