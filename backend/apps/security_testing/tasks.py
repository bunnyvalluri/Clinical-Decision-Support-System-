"""
Celery background tasks for Security Testing.
Executes on the dedicated 'security_scans' queue to guarantee process and resource isolation.
"""
import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from apps.security_testing.models import SecurityScan, SecurityFinding, SecurityScanState
from apps.security_testing.services.orchestrator import SecurityOrchestrator
from apps.security_testing.services.retest import SecurityRetestService

logger = logging.getLogger("security_testing.tasks")
User = get_user_model()


@shared_task(
    name="apps.security_testing.tasks.run_security_scan_task",
    queue="security_scans",
    time_limit=300,
    soft_time_limit=270,
    bind=True,
)
def run_security_scan_task(self, scan_id: str, actor_id: str = None):
    """
    Background execution of an authorized security scan.
    """
    logger.info(f"Starting Celery security scan task for scan_id={scan_id}")
    actor = None
    if actor_id:
        actor = User.objects.filter(id=actor_id).first()

    try:
        scan = SecurityOrchestrator.start_scan(scan_id, actor=actor)
        return {"status": scan.status, "scan_id": scan_id}
    except Exception as exc:
        logger.exception(f"Unhandled error in security scan task {scan_id}")
        scan = SecurityScan.objects.filter(id=scan_id).first()
        if scan:
            scan.status = SecurityScanState.FAILED
            scan.error_message = f"Celery worker error: {str(exc)}"
            scan.save(update_fields=["status", "error_message"])
        raise exc


@shared_task(
    name="apps.security_testing.tasks.execute_retest_task",
    queue="security_scans",
    time_limit=120,
)
def execute_retest_task(finding_id: str, tester_id: str = None):
    """
    Background execution of vulnerability retest.
    """
    logger.info(f"Executing background retest for finding_id={finding_id}")
    finding = SecurityFinding.objects.filter(id=finding_id).first()
    if not finding:
        return {"error": "Finding not found"}

    tester = None
    if tester_id:
        tester = User.objects.filter(id=tester_id).first()

    retest = SecurityRetestService.execute_retest(finding, tester_user=tester)
    return {"passed": retest.passed, "finding_id": finding_id}
