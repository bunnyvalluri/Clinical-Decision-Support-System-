"""
Periodic scheduled analytics tasks executed via Celery Beat.
Aggregates departmental clinical metrics and broadcasts dashboard updates.
"""
from datetime import datetime, timezone
import logging
from typing import Any

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.db.models import Avg, Count, Q
from django.utils import timezone as django_timezone

from apps.patients.models import Patient
from apps.predictions.models import Prediction, RiskLevel
from channels_app.events import DashboardStatsUpdatedEvent
from config.celery import BaseCDSSAsyncJob

logger = logging.getLogger("celery.tasks.scheduled")


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="celery_tasks.scheduled_tasks.compute_periodic_analytics_task",
    time_limit=60,
    soft_time_limit=45,
)
def compute_periodic_analytics_task(self) -> dict[str, Any]:
    """
    Periodic analytics job calculating real-time aggregate CDSS metrics.
    Broadcasts DASHBOARD_STATS_UPDATED to dashboard WebSocket group.
    """
    logger.info("compute_periodic_analytics_task triggered.")
    now = django_timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    try:
        total_patients = Patient.objects.count()
        today_predictions_qs = Prediction.objects.filter(prediction_timestamp__gte=today_start)

        predictions_today = today_predictions_qs.count()

        high_risk_cases = Prediction.objects.filter(
            prediction_result=RiskLevel.HIGH,
            prediction_timestamp__gte=today_start,
        ).count()

        critical_risk_cases = Prediction.objects.filter(
            prediction_result=RiskLevel.CRITICAL,
            prediction_timestamp__gte=today_start,
        ).count()

        avg_lat = today_predictions_qs.aggregate(Avg("inference_latency_ms"))["inference_latency_ms__avg"]
        avg_latency_ms = round(float(avg_lat or 1.25), 2)

        # Retrieve active model
        latest_pred = Prediction.objects.order_by("-prediction_timestamp").first()
        active_model = latest_pred.model_name if latest_pred else "RandomForestClassifier"

        # Broadcast over WebSockets
        channel_layer = get_channel_layer()
        if channel_layer:
            event = DashboardStatsUpdatedEvent(
                total_patients=total_patients,
                high_risk_cases=high_risk_cases,
                critical_risk_cases=critical_risk_cases,
                predictions_today=predictions_today,
                avg_latency_ms=avg_latency_ms,
                active_model=active_model,
            ).to_dict()

            async_to_sync(channel_layer.group_send)(
                "dashboard",
                {"type": "dashboard_stats_updated", "payload": event},
            )

        return {
            "total_patients": total_patients,
            "predictions_today": predictions_today,
            "high_risk_cases": high_risk_cases,
            "critical_risk_cases": critical_risk_cases,
            "avg_latency_ms": avg_latency_ms,
            "active_model": active_model,
            "calculated_at": now.isoformat(),
        }

    except Exception as exc:
        logger.error("Failed to compute periodic analytics: %s", exc, exc_info=True)
        raise self.retry(exc=exc)
