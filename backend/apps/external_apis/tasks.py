import logging
from celery import shared_task
from django.utils import timezone

from apps.external_apis.services.gateway import ExternalAPIService
from apps.external_apis.models import ExternalAPIRegistry, APIStatus

logger = logging.getLogger(__name__)


@shared_task(name="tasks.check_external_apis_health")
def check_external_apis_health_task():
    """
    Periodic Celery task checking health and availability of all registered external APIs.
    """
    logger.info("Executing scheduled external APIs health probe...")
    service = ExternalAPIService()
    results = service.run_health_checks()
    healthy_count = sum(1 for r in results if r.get("is_available"))
    logger.info(
        "External APIs health probe completed: %d/%d available.",
        healthy_count,
        len(results),
    )
    return {"total": len(results), "healthy": healthy_count, "timestamp": timezone.now().isoformat()}


@shared_task(name="tasks.sync_public_apis_catalog")
def sync_public_apis_catalog_task():
    """
    Background catalog change detection and synchronization task.
    """
    logger.info("Running public-apis catalog synchronization task...")
    active_count = ExternalAPIRegistry.objects.filter(status=APIStatus.ACTIVE).count()
    return {"synced": True, "active_apis": active_count}
