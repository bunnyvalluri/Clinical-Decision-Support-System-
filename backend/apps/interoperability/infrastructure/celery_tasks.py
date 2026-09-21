"""
Celery Background Tasks for FHIR Synchronization — BPY-CSE-2666.
"""
from datetime import datetime
import time
from celery import shared_task
from django.utils import timezone

from apps.interoperability.domain.enums import SyncDirection, SyncStatus
from apps.interoperability.models import FHIREndpoint, FHIRSyncJob


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def execute_fhir_sync_job_task(self, job_id: str):
    """
    Executes an asynchronous FHIR synchronization job in Celery worker.
    """
    from apps.interoperability.application.import_service import InboundImportService
    from apps.interoperability.infrastructure.http_client import FHIRHTTPClient

    try:
        job = FHIRSyncJob.objects.get(id=job_id)
    except FHIRSyncJob.DoesNotExist:
        return {"error": f"Sync job {job_id} not found."}

    job.status = SyncStatus.RUNNING
    job.started_at = timezone.now()
    job.save(update_fields=["status", "started_at", "updated_at"])

    start_time = time.perf_counter()
    endpoint = job.endpoint

    if not endpoint or not endpoint.is_active:
        job.status = SyncStatus.FAILED
        job.error_log = "Target endpoint is missing or inactive."
        job.completed_at = timezone.now()
        job.save()
        return {"error": job.error_log}

    headers = {}
    auth_config = endpoint.auth_config or {}
    if endpoint.auth_type == FHIREndpoint.AuthType.BEARER and "token" in auth_config:
        headers["Authorization"] = f"Bearer {auth_config['token']}"
    elif endpoint.auth_type == FHIREndpoint.AuthType.API_KEY and "api_key" in auth_config:
        header_name = auth_config.get("header_name", "X-API-Key")
        headers[header_name] = auth_config["api_key"]

    total = 0
    imported = 0
    conflicts = 0
    failed = 0
    error_messages = []

    try:
        resources = job.resources_requested or ["Patient", "Observation"]
        for res_type in resources:
            url = f"{endpoint.base_url.rstrip('/')}/{res_type}?_count=50"
            try:
                bundle = FHIRHTTPClient.get(url, headers=headers, timeout=endpoint.timeout_seconds)
                entries = bundle.get("entry", [])
                for entry in entries:
                    res = entry.get("resource")
                    if not res:
                        continue
                    total += 1
                    try:
                        res_outcome = InboundImportService.import_resource(
                            payload=res,
                            endpoint=endpoint,
                            sync_job=job,
                            user=job.triggered_by,
                        )
                        status_str = res_outcome.get("status")
                        if status_str in ("CREATED", "UPDATED", "EXISTING_MATCH"):
                            imported += 1
                        elif status_str == "CONFLICT":
                            conflicts += 1
                    except Exception as e:
                        failed += 1
                        error_messages.append(f"Resource {res_type} import error: {str(e)}")
            except Exception as e:
                error_messages.append(f"Failed to fetch {res_type} from {url}: {str(e)}")

        job.total_records = total
        job.imported_records = imported
        job.conflicts_generated = conflicts
        job.failed_records = failed
        job.error_log = "\n".join(error_messages[:50])

        if failed == 0 and total > 0:
            job.status = SyncStatus.COMPLETED
        elif imported > 0 and (failed > 0 or conflicts > 0):
            job.status = SyncStatus.PARTIAL_SUCCESS
        elif total == 0 and not error_messages:
            job.status = SyncStatus.COMPLETED
        else:
            job.status = SyncStatus.FAILED

        endpoint.last_sync_at = timezone.now()
        endpoint.health_status = "HEALTHY" if job.status in (SyncStatus.COMPLETED, SyncStatus.PARTIAL_SUCCESS) else "DEGRADED"
        endpoint.save(update_fields=["last_sync_at", "health_status", "updated_at"])

    except Exception as e:
        job.status = SyncStatus.FAILED
        job.error_log = f"Unexpected sync job execution failure: {str(e)}"
    finally:
        elapsed = (time.perf_counter() - start_time) * 1000.0
        job.duration_ms = round(elapsed, 2)
        job.completed_at = timezone.now()
        job.save()

    return {
        "job_id": str(job.id),
        "status": job.status,
        "total": total,
        "imported": imported,
        "conflicts": conflicts,
        "failed": failed,
    }


@shared_task
def poll_external_fhir_endpoints():
    """Periodic task that schedules sync jobs for all active endpoints."""
    active_endpoints = FHIREndpoint.objects.filter(is_active=True)
    scheduled_count = 0
    for ep in active_endpoints:
        job = FHIRSyncJob.objects.create(
            endpoint=ep,
            direction=SyncDirection.INBOUND_IMPORT,
            status=SyncStatus.PENDING,
            resources_requested=["Patient", "Observation"],
        )
        execute_fhir_sync_job_task.delay(str(job.id))
        scheduled_count += 1
    return {"scheduled_jobs": scheduled_count}
