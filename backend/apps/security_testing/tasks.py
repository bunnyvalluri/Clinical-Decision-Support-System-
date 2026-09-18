"""
Celery background tasks for Security Testing & Strix DevSecOps integration.
All tasks run on the dedicated 'security_scans' queue for process and resource isolation.
Clinical application tasks on the default queue are never affected.
"""
import logging
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.security_testing.models import SecurityScan, SecurityFinding, SecurityScanState
from apps.security_testing.services.orchestrator import SecurityOrchestrator
from apps.security_testing.services.retest import SecurityRetestService

logger = logging.getLogger("security_testing.tasks")
User = get_user_model()


@shared_task(
    name="apps.security_testing.tasks.run_security_scan_task",
    queue="security_scans",
    time_limit=360,
    soft_time_limit=330,
    bind=True,
    max_retries=0,  # No auto-retry for unauthorized/blocked scans
)
def run_security_scan_task(self, scan_id: str, actor_id: str = None):
    """
    Background execution of an authorized security scan.
    Routes to StrixSecurityAdapter if available, falls back to AgenticBugHunterAdapter.
    """
    logger.info(f"[Task] run_security_scan_task scan_id={scan_id}")
    actor = None
    if actor_id:
        actor = User.objects.filter(id=actor_id).first()

    try:
        scan = SecurityOrchestrator.start_scan(scan_id, actor=actor)
        return {"status": scan.status, "scan_id": scan_id}
    except Exception as exc:
        logger.exception(f"[Task] Unhandled error in security scan {scan_id}")
        scan = SecurityScan.objects.filter(id=scan_id).first()
        if scan:
            scan.status = SecurityScanState.FAILED
            scan.error_message = f"Celery worker error: {str(exc)[:500]}"
            scan.save(update_fields=["status", "error_message"])
        raise


@shared_task(
    name="apps.security_testing.tasks.run_strix_scan_task",
    queue="security_scans",
    time_limit=600,
    soft_time_limit=570,
    bind=True,
    max_retries=0,
)
def run_strix_scan_task(self, scan_id: str, actor_id: str = None):
    """
    Dedicated Celery task for Strix-powered security scans.
    Uses StrixSecurityAdapter with full policy enforcement and workspace isolation.
    """
    logger.info(f"[Task] run_strix_scan_task scan_id={scan_id}")
    actor = None
    if actor_id:
        actor = User.objects.filter(id=actor_id).first()

    try:
        from apps.security_testing.services.strix_adapter import StrixSecurityAdapter
        scan = SecurityScan.objects.get(id=scan_id)
        adapter = StrixSecurityAdapter()
        adapter.initialize(scan)
        findings = adapter.run_strix_scan(scan)
        return {
            "status": scan.status,
            "scan_id": scan_id,
            "findings_count": len(findings),
        }
    except SecurityScan.DoesNotExist:
        logger.error(f"[Task] Scan {scan_id} not found.")
        return {"error": "Scan not found", "scan_id": scan_id}
    except Exception as exc:
        logger.exception(f"[Task] Strix scan task error for {scan_id}")
        scan = SecurityScan.objects.filter(id=scan_id).first()
        if scan:
            scan.status = SecurityScanState.FAILED
            scan.error_message = f"Strix task error: {str(exc)[:500]}"
            scan.save(update_fields=["status", "error_message"])
        raise


@shared_task(
    name="apps.security_testing.tasks.execute_retest_task",
    queue="security_scans",
    time_limit=120,
    bind=True,
    max_retries=1,
    default_retry_delay=30,
)
def execute_retest_task(self, finding_id: str, tester_id: str = None):
    """
    Background execution of vulnerability retest to verify if a fix is effective.
    """
    logger.info(f"[Task] execute_retest_task finding_id={finding_id}")
    finding = SecurityFinding.objects.filter(id=finding_id).first()
    if not finding:
        return {"error": "Finding not found"}

    tester = None
    if tester_id:
        tester = User.objects.filter(id=tester_id).first()

    retest = SecurityRetestService.execute_retest(finding, tester_user=tester)
    return {"passed": retest.passed, "finding_id": finding_id}


@shared_task(
    name="apps.security_testing.tasks.generate_security_report_task",
    queue="security_scans",
    time_limit=120,
    bind=True,
)
def generate_security_report_task(self, scan_id: str, report_type: str = "TECHNICAL_DEV", requester_id: str = None):
    """
    Asynchronously generates a security report from a completed scan's findings.
    """
    logger.info(f"[Task] generate_security_report_task scan_id={scan_id}")
    try:
        from apps.security_testing.models import SecurityReport, SecurityFinding, FindingSeverity
        scan = SecurityScan.objects.get(id=scan_id)
        requester = User.objects.filter(id=requester_id).first() if requester_id else None

        findings = SecurityFinding.objects.filter(scan=scan)
        severity_summary = {
            "critical": findings.filter(severity=FindingSeverity.CRITICAL).count(),
            "high": findings.filter(severity=FindingSeverity.HIGH).count(),
            "medium": findings.filter(severity=FindingSeverity.MEDIUM).count(),
            "low": findings.filter(severity=FindingSeverity.LOW).count(),
            "info": findings.filter(severity=FindingSeverity.INFO).count(),
        }
        report = SecurityReport.objects.create(
            scan=scan,
            title=f"Security Report — {scan.target.name} ({scan.scan_type})",
            summary=(
                f"Strix v{scan.strix_version or 'N/A'} assessment completed on {scan.target.name}. "
                f"Coverage: {scan.coverage_status}. "
                f"Total findings: {findings.count()}."
            ),
            report_type=report_type,
            findings_summary=severity_summary,
            generated_by=requester,
        )
        return {"report_id": str(report.id), "scan_id": scan_id}
    except Exception as exc:
        logger.exception(f"[Task] Report generation failed for scan {scan_id}: {exc}")
        raise


@shared_task(
    name="apps.security_testing.tasks.cleanup_security_workspace_task",
    queue="security_scans",
    time_limit=30,
)
def cleanup_security_workspace_task(workspace_path: str):
    """
    Cleanup an orphaned Strix ephemeral workspace directory.
    """
    import shutil, os, tempfile
    logger.info(f"[Task] Cleaning up workspace: {workspace_path}")
    temp_dir = tempfile.gettempdir()
    if workspace_path and ("strix_" in os.path.basename(workspace_path)) and os.path.exists(workspace_path):  # nosec B108
        shutil.rmtree(workspace_path, ignore_errors=True)
        logger.info(f"[Task] Workspace removed: {workspace_path}")
    return {"cleaned": workspace_path}


# ---------------------------------------------------------------------------
# Prompt 44: Pentest-Agents Celery Tasks
# ---------------------------------------------------------------------------

@shared_task(
    name="apps.security_testing.tasks.run_pentest_agent",
    queue="security_scans",
    time_limit=450,
    soft_time_limit=420,
    bind=True,
    max_retries=0,
)
def run_pentest_agent(self, agent_run_id: str):
    """
    Executes a controlled pentest-agents run inside its isolated sandbox workspace.
    """
    logger.info(f"[Task] run_pentest_agent agent_run_id={agent_run_id}")
    from apps.security_testing.models import SecurityAgentRun
    from integrations.pentest_agents.service import PentestAgentsService

    agent_run = SecurityAgentRun.objects.filter(id=agent_run_id).first()
    if not agent_run:
        logger.error(f"[Task] SecurityAgentRun {agent_run_id} not found.")
        return {"error": "Agent run not found"}

    return PentestAgentsService.execute_agent_run(
        assessment=agent_run.assessment, agent_run=agent_run
    )


@shared_task(
    name="apps.security_testing.tasks.validate_agent_finding",
    queue="security_scans",
    time_limit=60,
    bind=True,
)
def validate_agent_finding(self, finding_id: str):
    """
    Evaluates an unvalidated finding against the 7-question validation gate.
    """
    logger.info(f"[Task] validate_agent_finding finding_id={finding_id}")
    from apps.security_testing.models import SecurityFinding, SecurityValidation, FindingState
    from integrations.pentest_agents.validators import SevenQuestionValidator

    finding = SecurityFinding.objects.filter(id=finding_id).first()
    if not finding:
        return {"error": "Finding not found"}

    raw_data = {
        "title": finding.title,
        "affected_endpoint": finding.affected_endpoint,
        "description": finding.description,
        "impact": finding.impact,
        "remediation_guidance": finding.remediation_guidance,
        "severity": finding.severity,
        "reproduction_steps": finding.evidences.first().reproduction_steps if finding.evidences.exists() else "",
    }
    res = SevenQuestionValidator.evaluate_finding(raw_data)
    if res["passed"]:
        finding.state = FindingState.VALIDATED
    else:
        finding.state = FindingState.FALSE_POSITIVE
    finding.save(update_fields=["state"])

    return {"finding_id": finding_id, "decision": res["decision"], "passed": res["passed"]}


@shared_task(
    name="apps.security_testing.tasks.generate_agent_report",
    queue="security_scans",
    time_limit=120,
    bind=True,
)
def generate_agent_report(self, assessment_id: str, platform: str = "HACKERONE"):
    """
    Generates a draft bug bounty or technical report for the given assessment.
    """
    logger.info(f"[Task] generate_agent_report assessment_id={assessment_id} platform={platform}")
    from apps.security_testing.models import SecurityScan
    from integrations.pentest_agents.service import PentestAgentsService

    scan = SecurityScan.objects.filter(id=assessment_id).first()
    if not scan:
        return {"error": "Assessment not found"}

    return PentestAgentsService.generate_bounty_draft_report(assessment=scan, platform=platform)


@shared_task(
    name="apps.security_testing.tasks.run_security_retest",
    queue="security_scans",
    time_limit=120,
    bind=True,
)
def run_security_retest(self, finding_id: str):
    """
    Runs automated retesting to verify finding closure.
    """
    logger.info(f"[Task] run_security_retest finding_id={finding_id}")
    from apps.security_testing.models import SecurityFinding
    from integrations.pentest_agents.service import PentestAgentsService

    finding = SecurityFinding.objects.filter(id=finding_id).first()
    if not finding:
        return {"error": "Finding not found"}

    passed, msg = PentestAgentsService.execute_retest(finding=finding)
    return {"finding_id": finding_id, "passed": passed, "message": msg}


@shared_task(
    name="apps.security_testing.tasks.cleanup_agent_workspace",
    queue="security_scans",
    time_limit=30,
)
def cleanup_agent_workspace(self, assessment_id: str):
    """
    Cleans up the ephemeral workspace directory for an assessment.
    """
    from integrations.pentest_agents.runner import WorkspaceSandboxManager
    WorkspaceSandboxManager.cleanup_workspace(assessment_id)
    return {"cleaned": assessment_id}

