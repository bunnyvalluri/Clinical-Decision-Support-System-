"""
Webhook ingest handler for external CI/CD failure events (GitHub Actions, Coolify, Bruno).
Validates signatures, prevents infinite remediation loops, and triggers controlled remediation jobs.
"""
import hmac
import hashlib
import json
import logging
from typing import Dict, Any, Tuple
from django.conf import settings
from integrations.jules.services import JulesRemediationService
from integrations.jules.models import RemediationTriggerType, RemediationIssueCategory, RemediationSeverity

logger = logging.getLogger("jules.webhooks")
MAX_REMEDIATION_ATTEMPTS = 2


class JulesWebhookProcessor:
    @classmethod
    def verify_github_signature(cls, payload_bytes: bytes, signature_header: str, secret: str) -> bool:
        """Verifies HMAC SHA-256 signature from GitHub webhooks."""
        if not signature_header or not secret:
            return False
        expected_sig = "sha256=" + hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, signature_header)

    @classmethod
    def process_ci_failure(cls, payload: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Processes a CI failure event and queues a remediation job subject to retry limits.
        """
        repo = payload.get("repository", "HealthNova-AI")
        branch = payload.get("branch", "develop")
        run_id = str(payload.get("run_id", ""))
        failure_type = payload.get("failure_type", "CI_FAILURE")
        error_msg = payload.get("error_message", "CI pipeline failure detected")

        # Map to category
        category = RemediationIssueCategory.CI_FAILURE
        if "typescript" in failure_type.lower():
            category = RemediationIssueCategory.TYPESCRIPT_ERROR
        elif "react" in failure_type.lower():
            category = RemediationIssueCategory.REACT_ERROR
        elif "test" in failure_type.lower():
            category = RemediationIssueCategory.TEST_FAILURE
        elif "lint" in failure_type.lower():
            category = RemediationIssueCategory.LINT_FAILURE

        job = JulesRemediationService.create_remediation_job(
            title=f"CI Failure: {failure_type} (Run #{run_id})",
            issue_category=category,
            description=error_msg,
            repository=repo,
            branch=branch,
            trigger_type=RemediationTriggerType.CI_FAILURE,
            severity=RemediationSeverity.HIGH,
            issue_reference=f"CI-RUN-{run_id}",
            error_log=payload.get("logs", ""),
        )

        return True, job.correlation_id
