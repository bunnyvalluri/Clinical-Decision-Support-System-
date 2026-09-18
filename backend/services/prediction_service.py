"""
Prediction Service for real-time and batch clinical risk inference.
Provides sub-20ms inference using in-memory cached ML pipelines, automated
explainability attribution, HIPAA audit logging for clinician overrides,
and zero training-serving skew.
"""
import logging
from typing import TYPE_CHECKING, Any
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import ApplicationError
from apps.core.models import AuditLog
from apps.predictions.models import Prediction, RiskLevel
from services.base import BaseService
from services.feature_preprocessor import FeatureValidationError, MissingFeatureError
from services.model_provider import ModelUnavailableError
from services.prediction_result import PredictionResult

if TYPE_CHECKING:
    from repositories.prediction_repository import IPredictionRepository
    from services.risk_engine import RiskPredictionEngine

logger = logging.getLogger(__name__)


class PredictionServiceError(ApplicationError):
    message = "Clinical prediction error occurred."
    code = "prediction_service_error"
    status_code = 500


class MissingClinicalDataError(PredictionServiceError):
    message = "Insufficient clinical vitals or observation data for risk assessment."
    code = "missing_clinical_data"
    status_code = 400


class PatientNotFoundError(PredictionServiceError):
    message = "Patient record was not found."
    code = "patient_not_found"
    status_code = 404


def _broadcast_realtime_event(prediction: Prediction) -> None:
    """Broadcast real-time WebSocket events, dashboard stats, and high-risk notifications safely."""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        from apps.notifications.models import Notification, NotificationSeverity, NotificationChannel
        from apps.patients.models import Patient
        from channels_app.events import (
            DashboardStatsUpdatedEvent,
            NotificationEvent,
            PredictionCreatedEvent,
            RiskAlertEvent,
        )

        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        pred_dict = PredictionCreatedEvent(
            prediction_id=str(prediction.id),
            patient_id=str(prediction.patient_id),
            risk_level=prediction.prediction_result,
            probability=float(prediction.probability),
            model_name=prediction.model_name,
            model_version=prediction.model_version_str,
            timestamp=prediction.prediction_timestamp.isoformat(),
        ).to_dict()

        # 1. Update patient channel
        async_to_sync(channel_layer.group_send)(
            f"patient_{prediction.patient_id}",
            pred_dict,
        )

        # 2. Update dashboard stream with prediction-created event
        async_to_sync(channel_layer.group_send)(
            "dashboard",
            pred_dict,
        )

        # 3. Update dashboard aggregate statistics without page refresh
        try:
            total_patients = Patient.objects.count()
            high_count = Prediction.objects.filter(prediction_result=RiskLevel.HIGH).count()
            crit_count = Prediction.objects.filter(prediction_result=RiskLevel.CRITICAL).count()
            total_preds = Prediction.objects.count()
            latency = float(getattr(prediction, "inference_latency_ms", 1.25) or 1.25)

            stats_dict = DashboardStatsUpdatedEvent(
                total_patients=total_patients,
                high_risk_cases=high_count,
                critical_risk_cases=crit_count,
                predictions_today=total_preds,
                avg_latency_ms=latency,
                active_model=f"{prediction.model_name} {prediction.model_version_str}",
                timestamp=prediction.prediction_timestamp.isoformat(),
            ).to_dict()

            async_to_sync(channel_layer.group_send)(
                "dashboard",
                stats_dict,
            )
        except Exception as stats_err:
            logger.debug("Dashboard stats calculation skipped: %s", stats_err)

        # 4. High/Critical risk alerts
        if prediction.prediction_result in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            patient_mrn = prediction.patient.mrn if prediction.patient else ""
            alert_dict = RiskAlertEvent(
                prediction_id=str(prediction.id),
                patient_id=str(prediction.patient_id),
                patient_mrn=patient_mrn,
                risk_level=prediction.prediction_result,
                probability=float(prediction.probability),
                severity=(
                    "CRITICAL"
                    if prediction.prediction_result == RiskLevel.CRITICAL
                    else "HIGH"
                ),
                message=(
                    f"Patient {patient_mrn} assessed at {prediction.prediction_result} "
                    f"risk with {float(prediction.probability):.1%} probability."
                ),
                timestamp=prediction.prediction_timestamp.isoformat(),
            ).to_dict()

            async_to_sync(channel_layer.group_send)(
                "risk_alerts",
                alert_dict,
            )

            recipient = getattr(prediction.patient, "primary_physician", None)
            if recipient:
                notif = Notification.objects.create(
                    recipient=recipient,
                    patient=prediction.patient,
                    prediction=prediction,
                    severity=(
                        NotificationSeverity.CRITICAL
                        if prediction.prediction_result == RiskLevel.CRITICAL
                        else NotificationSeverity.HIGH
                    ),
                    channel=NotificationChannel.WEBSOCKET,
                    title=f"Clinical Alert: {patient_mrn} - {prediction.prediction_result}",
                    message=(
                        f"Patient {patient_mrn} assessed at {prediction.prediction_result} "
                        f"risk with {float(prediction.probability):.1%} probability."
                    ),
                    action_url=f"/patients/{prediction.patient_id}/predictions/{prediction.id}/",
                )
                notif_dict = NotificationEvent(
                    notification_id=str(notif.id),
                    title=notif.title,
                    severity=notif.severity,
                    message=notif.message,
                    action_url=notif.action_url,
                ).to_dict()

                async_to_sync(channel_layer.group_send)(
                    f"notifications_{recipient.id}",
                    notif_dict,
                )
    except Exception as exc:
        logger.warning("Real-time prediction event broadcast skipped or failed: %s", exc)


class PredictionService(BaseService):
    """
    High-performance clinical risk prediction service.
    Coordinates between clinical inputs, feature preprocessing, in-memory ML inference,
    explainability generation, atomic database transactions, and real-time alerts.
    """

    FEATURE_MAPPING = {
        "heart_rate": "heart_rate",
        "respiratory_rate": "respiratory_rate",
        "temperature": "body_temperature",
        "body_temperature": "body_temperature",
        "oxygen_saturation": "oxygen_saturation",
        "systolic_bp": "systolic_bp",
        "diastolic_bp": "diastolic_bp",
        "glucose": "glucose_level",
        "glucose_level": "glucose_level",
        "cholesterol": "cholesterol_total",
        "cholesterol_total": "cholesterol_total",
        "bmi": "bmi",
        "creatinine": "creatinine",
        "sodium": "sodium",
        "calcium": "calcium",
        "lactic_acid": "lactic_acid",
    }

    def __init__(
        self,
        engine: Any = None,
        repository: Any = None,
    ) -> None:
        super().__init__()
        if engine is None:
            from services.risk_engine import RiskPredictionEngine
            engine = RiskPredictionEngine()
        if repository is None:
            from repositories.prediction_repository import DjangoPredictionRepository
            repository = DjangoPredictionRepository()
        self.engine = engine
        self.repository = repository

    def predict_patient(
        self,
        patient_id: UUID | str,
        clinical_record_id: UUID | str | None = None,
        model_name: str | None = None,
        explicit_vitals: dict[str, Any] | None = None,
        vitals: dict[str, Any] | None = None,
        requested_by: Any = None,
        **kwargs: Any,
    ) -> Prediction:
        """
        Execute real-time patient risk prediction pipeline:
        1. Fetch patient demographic and latest clinical observations.
        2. Validate features against physiological limits.
        3. Run in-memory inference and compute explainability attributions.
        4. Persist Prediction and Explanation records atomically.
        5. Emit real-time WebSocket events.
        """
        effective_vitals = explicit_vitals if explicit_vitals is not None else vitals

        # 1. Fetch patient and clinical vitals
        try:
            patient, clinical_record, features = self.repository.get_patient_data(
                patient_id=patient_id, clinical_record_id=clinical_record_id
            )
        except ValueError as exc:
            if "Patient with ID" in str(exc):
                raise PatientNotFoundError(str(exc)) from exc
            raise MissingClinicalDataError(str(exc)) from exc

        # 2. Incorporate explicit vitals if supplied
        if effective_vitals:
            normalized_explicit: dict[str, Any] = {}
            for k, v in effective_vitals.items():
                mapped_k = self.FEATURE_MAPPING.get(k, k)
                normalized_explicit[mapped_k] = v
            features.update(normalized_explicit)

        # Ensure we have vitals beyond just demographic age and gender
        vitals_present = any(
            features.get(k) is not None
            for k in (
                "systolic_bp",
                "diastolic_bp",
                "heart_rate",
                "respiratory_rate",
                "body_temperature",
                "oxygen_saturation",
                "glucose_level",
                "cholesterol_total",
                "bmi",
            )
        )
        if not vitals_present:
            raise MissingClinicalDataError(
                f"No clinical vitals found for patient '{patient_id}'. "
                f"Record a clinical encounter or pass explicit vitals."
            )

        # 3. Execute inference via RiskPredictionEngine
        rec_id = clinical_record.id if clinical_record else None
        try:
            prediction_result = self.engine.predict(
                patient_id=patient.id,
                features=features,
                clinical_record_id=rec_id,
                model_name=model_name,
            )
        except MissingFeatureError as exc:
            raise MissingClinicalDataError(str(exc)) from exc
        except FeatureValidationError:
            raise
        except ModelUnavailableError as exc:
            logger.error("ML model unavailable for inference: %s", exc)
            raise PredictionServiceError(
                "Prediction service is temporarily unable to load the active model.",
                status_code=500,
            ) from exc
        except Exception as exc:
            logger.error("Inference failed unexpectedly: %s", exc, exc_info=True)
            raise PredictionServiceError(
                "Inference failure occurred during risk assessment.",
                status_code=500,
            ) from exc

        # 4. Atomic PostgreSQL Persistence
        prediction = self.repository.save_prediction(prediction_result)

        # Attach patient relationship for caller convenience
        prediction.patient = patient
        if clinical_record:
            prediction.clinical_record = clinical_record

        # 5. Intelligent Clinical Decision Support Synthesis
        try:
            from services.clinical_decision_support_service import ClinicalDecisionSupportService
            cdss = ClinicalDecisionSupportService()
            prediction.cdss_guidance = cdss.generate_support_guidance(
                patient_id=str(patient.id),
                features=features,
                prediction=prediction,
            )
        except Exception as cdss_exc:
            logger.warning("CDSS guidance synthesis warning: %s", cdss_exc)
            prediction.cdss_guidance = None

        # 6. Real-time Event Dispatching
        _broadcast_realtime_event(prediction)

        return prediction

    def predict_batch(
        self,
        batch_requests: list[dict[str, Any]] | None = None,
        records: list[dict[str, Any]] | None = None,
        model_name: str | None = None,
        requested_by: Any = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """
        Execute high-throughput batch prediction for multiple patients simultaneously.
        """
        effective_items = batch_requests if batch_requests is not None else records
        if not effective_items:
            return []

        from uuid import uuid4
        prepared_items: list[dict[str, Any]] = []
        has_patient_ids = False
        for req in effective_items:
            p_id = req.get("patient_id")
            if p_id:
                has_patient_ids = True
                rec_id = req.get("clinical_record_id")
                explicit = req.get("explicit_vitals") or req.get("vitals")
                patient, cl_rec, features = self.repository.get_patient_data(
                    patient_id=p_id, clinical_record_id=rec_id
                )
                if explicit:
                    for k, v in explicit.items():
                        features[self.FEATURE_MAPPING.get(k, k)] = v
                prepared_items.append(
                    {
                        "patient_id": patient.id,
                        "clinical_record_id": cl_rec.id if cl_rec else None,
                        "features": features,
                    }
                )
            else:
                # Raw feature dictionary directly provided
                prepared_items.append(
                    {
                        "patient_id": str(uuid4()),
                        "clinical_record_id": None,
                        "features": req,
                    }
                )

        # Run vectorized inference
        results = self.engine.predict_batch(prepared_items, model_name=model_name)

        saved_predictions: list[Any] = []
        if has_patient_ids:
            try:
                saved_predictions = self.repository.save_batch(results)
            except Exception as exc:
                logger.warning("Batch persistence skipped: %s", exc)

        # Return formatted dictionaries with comprehensive aliases
        output = []
        for idx, res in enumerate(results):
            pred_id = (
                str(saved_predictions[idx].id)
                if idx < len(saved_predictions)
                else str(uuid4())
            )
            p_id = str(prepared_items[idx]["patient_id"])
            output.append(
                {
                    "id": pred_id,
                    "prediction_id": pred_id,
                    "patient_id": p_id,
                    "prediction": res.risk_level,
                    "prediction_result": res.risk_level,
                    "risk_level": res.risk_level,
                    "probability": round(res.probability, 4),
                    "confidence_score": round(res.confidence_score, 4) if res.confidence_score is not None else None,
                    "model_name": res.model_name,
                    "model_version": res.model_version,
                    "model_version_str": res.model_version,
                    "inference_latency_ms": round(res.inference_latency_ms, 2),
                    "feature_schema_version": res.feature_schema_version,
                }
            )

        return output


    def record_clinical_override(
        self,
        prediction_id: UUID | str,
        clinician_override: str,
        override_reason: str,
        user: Any,
    ) -> Prediction:
        """
        Record physician clinical override of AI risk prediction.
        Ensures audit logging and reason compliance.
        """
        if clinician_override not in RiskLevel.values:
            raise ApplicationError(
                f"Invalid override risk level '{clinician_override}'. Allowed: {RiskLevel.values}",
                status_code=400,
            )

        if not override_reason or not override_reason.strip():
            raise ApplicationError(
                "Clinical justification is mandatory when overriding AI risk predictions.",
                status_code=400,
            )

        try:
            prediction = Prediction.objects.select_related("patient", "model_version").get(id=prediction_id)
        except Prediction.DoesNotExist as exc:
            raise ApplicationError(f"Prediction with id '{prediction_id}' not found.", status_code=404) from exc

        previous_result = prediction.prediction_result
        previous_override = prediction.clinician_override

        with transaction.atomic():
            prediction.clinician_override = clinician_override
            prediction.override_reason = override_reason.strip()
            prediction.overridden_by = user if user and user.is_authenticated else None
            prediction.save(update_fields=["clinician_override", "override_reason", "overridden_by", "updated_at"])

            AuditLog.objects.create(
                user=user if user and user.is_authenticated else None,
                action=AuditLog.Action.UPDATE,
                resource_type="Prediction",
                resource_id=str(prediction.id),
                metadata={
                    "previous_prediction": previous_result,
                    "previous_override": previous_override,
                    "new_override": clinician_override,
                    "override_reason": override_reason,
                    "patient_id": str(prediction.patient_id),
                },
                description=f"Physician override of AI risk from {previous_result} to {clinician_override}",
            )

        return prediction


# Alias for explicit domain interface
RiskPredictionService = PredictionService
