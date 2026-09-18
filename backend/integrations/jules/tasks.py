"""
Asynchronous Celery tasks for Google Jules engineering automation.
Handles source synchronization, session creation, background polling, and validation.
"""
import logging
from celery import shared_task
from integrations.jules.models import JulesRemediationJob, JulesSession, RemediationJobStatus
from integrations.jules.services import JulesSourceSyncService, JulesRemediationService
from integrations.jules.validators import JulesValidator

logger = logging.getLogger("jules.tasks")


@shared_task(name="jules.sync_sources")
def sync_jules_sources_task():
    """Periodic or triggered source repository synchronization."""
    try:
        sources = JulesSourceSyncService.sync_sources(actor_id="CELERY_WORKER")
        logger.info("Successfully synced %d Jules sources via Celery", len(sources))
        return {"status": "SUCCESS", "synced_sources": len(sources)}
    except Exception as e:
        logger.error("Failed to sync Jules sources: %s", e)
        return {"status": "FAILED", "error": str(e)}


@shared_task(name="jules.poll_session")
def poll_jules_session_task(session_id: str):
    """Polls an active session for activities and state changes."""
    try:
        session = JulesSession.objects.get(external_session_id=session_id)
        acts = JulesRemediationService.sync_session_activities(session)
        return {"status": "SUCCESS", "activities_synced": len(acts)}
    except JulesSession.DoesNotExist:
        logger.warning("Session %s not found for polling", session_id)
        return {"status": "NOT_FOUND"}
    except Exception as e:
        logger.error("Error polling session %s: %s", session_id, e)
        return {"status": "ERROR", "error": str(e)}


@shared_task(name="jules.validate_remediation")
def validate_jules_remediation_task(job_id: str):
    """Executes the validation pipeline on a completed remediation."""
    try:
        job = JulesRemediationJob.objects.get(id=job_id)
        files = job.validation_output.get("affected_files", [])
        results = JulesValidator.run_automated_checks(files)

        all_passed = results.get("all_passed", False)
        job.validation_status = "PASSED" if all_passed else "FAILED"
        job.validation_output["check_results"] = results
        job.status = RemediationJobStatus.AWAITING_REVIEW if all_passed else RemediationJobStatus.FAILED
        job.save(update_fields=["validation_status", "validation_output", "status", "updated_at"])

        return {"status": "SUCCESS", "validation_passed": all_passed}
    except JulesRemediationJob.DoesNotExist:
        return {"status": "NOT_FOUND"}
    except Exception as e:
        logger.error("Error validating remediation job %s: %s", job_id, e)
        return {"status": "ERROR", "error": str(e)}
