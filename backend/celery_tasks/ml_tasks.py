"""
ML-related Celery tasks.

These tasks are stubs for Stage 1. Full implementation in Stage 4/5.
Tasks here are responsible for:
  - Running async ML predictions
  - Training models in the background
  - Publishing results to WebSocket channel groups
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="celery_tasks.ml_tasks.run_prediction",
    max_retries=3,
    default_retry_delay=5,
)
def run_prediction(self, prediction_id: str) -> dict:
    """
    Run an ML prediction for the given prediction record ID.

    This task is triggered by the PredictionService after a Prediction
    record is created. It loads the active model, runs inference,
    stores results, and pushes a WebSocket event.

    Implemented fully in Stage 5.
    """
    logger.info("run_prediction task triggered for prediction_id=%s", prediction_id)
    # Implementation: Stage 5
    return {"status": "pending", "prediction_id": prediction_id}


@shared_task(
    bind=True,
    name="celery_tasks.ml_tasks.train_model",
    max_retries=1,
    default_retry_delay=60,
)
def train_model(self, model_type: str, dataset_name: str, ml_model_id: str) -> dict:
    """
    Train an ML model in the background.

    Implemented fully in Stage 4.
    """
    logger.info(
        "train_model task triggered: type=%s dataset=%s model_id=%s",
        model_type,
        dataset_name,
        ml_model_id,
    )
    # Implementation: Stage 4
    return {"status": "pending", "ml_model_id": ml_model_id}
