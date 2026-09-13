"""
Asynchronous bulk prediction processing Celery tasks.
Executes high-throughput vectorized risk assessments in the background with progress streaming.
"""
import logging
from typing import Any
import uuid

from billiard.exceptions import SoftTimeLimitExceeded
from celery import shared_task
from django.contrib.auth import get_user_model

from config.celery import BaseCDSSAsyncJob, broadcast_task_status
from services.prediction_service import PredictionService

logger = logging.getLogger("celery.tasks.predictions")
User = get_user_model()


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="apps.predictions.tasks.process_bulk_predictions_task",
    time_limit=360,
    soft_time_limit=300,
    max_retries=2,
    default_retry_delay=10,
)
def process_bulk_predictions_task(
    self,
    records: list[dict[str, Any]],
    model_name: str | None = None,
    requested_by_id: str | None = None,
    batch_id: str | None = None,
) -> dict[str, Any]:
    """
    Asynchronously process large batches of patient records.
    Reports progress intervals to WebSocket clients and returns aggregated risk summary.
    """
    batch_id = batch_id or str(uuid.uuid4())
    task_id = self.request.id or batch_id
    total_records = len(records)
    logger.info(
        "process_bulk_predictions_task started: batch_id=%s total=%d requested_by=%s",
        batch_id,
        total_records,
        requested_by_id,
    )

    broadcast_task_status(
        task_id=task_id,
        task_name="bulk_prediction_processing",
        status="PROCESSING",
        progress=10,
        result={"batch_id": batch_id, "total": total_records},
        recipient_user_id=requested_by_id,
    )

    try:
        user = None
        if requested_by_id:
            try:
                user = User.objects.get(id=requested_by_id)
            except User.DoesNotExist:
                pass

        service = PredictionService()

        broadcast_task_status(
            task_id=task_id,
            task_name="bulk_prediction_processing",
            status="PROCESSING",
            progress=40,
            result={"batch_id": batch_id, "processed": 0, "total": total_records},
            recipient_user_id=requested_by_id,
        )

        results = service.predict_batch(
            records=records,
            model_name=model_name,
            requested_by=user,
        )

        broadcast_task_status(
            task_id=task_id,
            task_name="bulk_prediction_processing",
            status="PROCESSING",
            progress=85,
            result={"batch_id": batch_id, "processed": len(results), "total": total_records},
            recipient_user_id=requested_by_id,
        )

        # Compute summary stats
        high_risk_count = sum(1 for r in results if r.get("risk_level") == "HIGH")
        critical_risk_count = sum(1 for r in results if r.get("risk_level") == "CRITICAL")
        low_risk_count = sum(1 for r in results if r.get("risk_level") == "LOW")
        mod_risk_count = sum(1 for r in results if r.get("risk_level") == "MODERATE")

        summary = {
            "batch_id": batch_id,
            "total_records": total_records,
            "successful_predictions": len(results),
            "high_risk_count": high_risk_count,
            "critical_risk_count": critical_risk_count,
            "moderate_risk_count": mod_risk_count,
            "low_risk_count": low_risk_count,
            "sample_prediction_ids": [r.get("prediction_id") for r in results[:5]],
        }

        broadcast_task_status(
            task_id=task_id,
            task_name="bulk_prediction_processing",
            status="COMPLETED",
            progress=100,
            result=summary,
            recipient_user_id=requested_by_id,
        )

        return summary

    except SoftTimeLimitExceeded:
        logger.warning("Soft time limit exceeded for batch %s", batch_id)
        broadcast_task_status(
            task_id=task_id,
            task_name="bulk_prediction_processing",
            status="FAILED",
            error="Bulk prediction job exceeded maximum time limit (300s).",
            recipient_user_id=requested_by_id,
        )
        raise

    except Exception as exc:
        logger.error("Bulk prediction batch %s failed: %s", batch_id, exc, exc_info=True)
        broadcast_task_status(
            task_id=task_id,
            task_name="bulk_prediction_processing",
            status="FAILED",
            error=str(exc),
            recipient_user_id=requested_by_id,
        )
        raise self.retry(exc=exc)
