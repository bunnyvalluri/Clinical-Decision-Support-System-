"""Report generation Celery tasks — implemented in Stage 7."""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    name="celery_tasks.report_tasks.generate_patient_report",
    bind=True,
    max_retries=2,
)
def generate_patient_report(self, report_id: str) -> dict:
    """
    Generate a PDF/CSV patient report asynchronously.
    Implementation: Stage 7.
    """
    logger.info("generate_patient_report triggered for report_id=%s", report_id)
    return {"status": "pending", "report_id": report_id}
