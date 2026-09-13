"""
ML-related Celery tasks.

Tasks responsible for:
  - Running async ML predictions
  - Training models in the background
  - Publishing results to WebSocket channel groups and notifications
"""
import logging
from typing import Any
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer

from apps.notifications.models import Notification, NotificationSeverity, NotificationChannel
from apps.predictions.models import Prediction, RiskLevel
from config.celery import BaseCDSSAsyncJob
from services.prediction_service import PredictionService

logger = logging.getLogger(__name__)


def _broadcast_prediction_events(prediction: Prediction) -> None:
    """Publish real-time WebSocket alerts and notifications for completed predictions."""
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        payload = {
            "prediction_id": str(prediction.id),
            "patient_id": str(prediction.patient_id),
            "patient_mrn": prediction.patient.mrn if prediction.patient else "",
            "prediction_result": prediction.prediction_result,
            "probability": float(prediction.probability),
            "model_name": prediction.model_name,
            "model_version": prediction.model_version_str,
            "timestamp": prediction.prediction_timestamp.isoformat(),
        }

        # 1. Update per-patient channel
        async_to_sync(channel_layer.group_send)(
            f"patient_{prediction.patient_id}",
            {"type": "patient_update", "payload": payload},
        )

        # 2. Update dashboard metric stream
        async_to_sync(channel_layer.group_send)(
            "dashboard",
            {"type": "dashboard_update", "payload": payload},
        )

        # 3. High/Critical Risk Alerts & Notifications
        if prediction.prediction_result in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            severity = (
                NotificationSeverity.CRITICAL
                if prediction.prediction_result == RiskLevel.CRITICAL
                else NotificationSeverity.HIGH
            )

            # Broadcast to risk_alerts group
            async_to_sync(channel_layer.group_send)(
                "risk_alerts",
                {"type": "risk_alert", "payload": payload},
            )

            # Persist notification if patient has an assigned physician
            recipient = getattr(prediction.patient, "primary_physician", None)
            if recipient:
                notif = Notification.objects.create(
                    recipient=recipient,
                    patient=prediction.patient,
                    prediction=prediction,
                    severity=severity,
                    channel=NotificationChannel.WEBSOCKET,
                    title=f"Clinical Alert: {prediction.patient.mrn} - {prediction.prediction_result}",
                    message=(
                        f"Patient {prediction.patient.mrn} assessed at {prediction.prediction_result} "
                        f"risk with {float(prediction.probability):.1%} probability."
                    ),
                    action_url=f"/patients/{prediction.patient_id}/predictions/{prediction.id}/",
                )
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{recipient.id}",
                    {
                        "type": "notification",
                        "payload": {
                            "notification_id": str(notif.id),
                            "title": notif.title,
                            "severity": notif.severity,
                            "message": notif.message,
                        },
                    },
                )
    except Exception as exc:
        logger.warning("Failed to broadcast real-time prediction event: %s", exc)


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="celery_tasks.ml_tasks.run_prediction",
    max_retries=3,
    default_retry_delay=5,
)
def run_prediction(
    self,
    patient_id: str | None = None,
    clinical_record_id: str | None = None,
    model_name: str | None = None,
    explicit_vitals: dict[str, Any] | None = None,
    prediction_id: str | None = None,
) -> dict:
    """
    Run an ML prediction asynchronously.
    Supports either pre-existing prediction_id or executing fresh inference via PredictionService.
    Broadcasts real-time events to subscribed WebSocket channel groups.
    """
    logger.info(
        "run_prediction task triggered: patient_id=%s record_id=%s prediction_id=%s",
        patient_id,
        clinical_record_id,
        prediction_id,
    )
    try:
        if prediction_id and not patient_id:
            prediction = Prediction.objects.select_related("patient", "model_version").get(id=prediction_id)
        else:
            if not patient_id:
                raise ValueError("Either patient_id or prediction_id must be provided.")
            service = PredictionService()
            prediction = service.predict_patient(
                patient_id=patient_id,
                clinical_record_id=clinical_record_id,
                model_name=model_name,
                explicit_vitals=explicit_vitals,
            )

        _broadcast_prediction_events(prediction)

        return {
            "status": "success",
            "prediction_id": str(prediction.id),
            "patient_id": str(prediction.patient_id),
            "prediction_result": prediction.prediction_result,
            "probability": float(prediction.probability),
            "latency_ms": float(prediction.inference_latency_ms),
        }
    except Exception as exc:
        logger.error("run_prediction task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="celery_tasks.ml_tasks.train_model",
    max_retries=1,
    default_retry_delay=60,
    time_limit=2400,
    soft_time_limit=1800,
)
def train_model(
    self,
    model_type: str,
    dataset_name: str = "clinical_risk_v1",
    version: str = "1.0.0",
    hyperparameters: dict[str, Any] | None = None,
    ml_model_id: str | None = None,
) -> dict:
    """
    Train an ML model in the background, compute evaluations, and persist to registry.
    """
    logger.info(
        "train_model task triggered: type=%s dataset=%s version=%s",
        model_type,
        dataset_name,
        version,
    )
    try:
        from ml.training.train import train_and_evaluate_model
        from apps.model_registry.models import ModelVersion, ModelAlgorithm, ModelStatus

        res = train_and_evaluate_model(
            model_type=model_type,
            dataset_name=dataset_name,
            version=version,
            hyperparameters=hyperparameters,
        )

        algo_map = {
            "SVM": ModelAlgorithm.SVM,
            "RANDOM_FOREST": ModelAlgorithm.RANDOM_FOREST,
            "RF": ModelAlgorithm.RANDOM_FOREST,
            "ADABOOST": ModelAlgorithm.ADABOOST,
        }
        algo = algo_map.get(model_type.upper(), ModelAlgorithm.RANDOM_FOREST)
        metrics = res.get("metrics", {})

        mv, _ = ModelVersion.objects.update_or_create(
            model_name=res["name"],
            version=res["version"],
            defaults={
                "algorithm": algo,
                "status": ModelStatus.CANDIDATE,
                "accuracy": metrics.get("accuracy", 0.0),
                "precision": metrics.get("precision", 0.0),
                "recall": metrics.get("recall", 0.0),
                "f1": metrics.get("f1", 0.0),
                "roc_auc": metrics.get("roc_auc"),
                "artifact_path": res["artifact_dir"],
                "training_dataset_id": dataset_name,
                "feature_schema_version": "v1.0",
                "preprocessing_version": "v1.0",
            },
        )

        return {
            "status": "success",
            "model_version_id": str(mv.id),
            "model_name": mv.model_name,
            "version": mv.version,
            "metrics": metrics,
        }
    except Exception as exc:
        logger.error("train_model task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc)
