"""
Seven-Question Validation Gate Service.
Preserves Agentic-Bug-Hunter's philosophy: validate findings and kill weak/theoretical findings before reporting.
"""
import logging
from typing import Tuple
from apps.security_testing.models import (
    SecurityFinding,
    SecurityValidation,
    FindingState,
    SecurityTarget,
    ApprovalStatus,
    SecurityEnvironment,
)

logger = logging.getLogger("security_testing.validation_gate")


class FindingValidationService:
    """
    Evaluates candidate security findings against the 7-question validation gate:
    1. Is the target authorized?
    2. Is the affected component actually vulnerable?
    3. Can the behavior be reproduced?
    4. Is the issue exploitable?
    5. Is there meaningful security impact?
    6. Is the evidence sufficient?
    7. Is the finding reportable?
    """

    THEORETICAL_PATTERNS = [
        "missing x-frame-options",
        "missing content-security-policy",
        "server version banner leaked",
        "cookie without samesite attribute",
        "package looks outdated",
        "endpoint exists",
        "missing strict-transport-security in dev",
    ]

    @classmethod
    def evaluate_finding(
        cls,
        finding: SecurityFinding,
        validator_user=None,
        validation_notes: str = "",
    ) -> Tuple[bool, SecurityValidation]:
        """
        Runs the 7-question audit on a SecurityFinding instance.
        Updates finding state to VALIDATED or FALSE_POSITIVE/REJECTED.
        """
        target: SecurityTarget = finding.target

        # Question 1: Is target authorized?
        is_target_authorized = bool(
            target
            and target.approval_status == ApprovalStatus.APPROVED
            and target.is_approval_valid
        )

        # Question 2: Is affected component actually vulnerable?
        # Rejects theoretical findings based solely on missing headers or generic banners
        is_theoretical = any(p in finding.title.lower() for p in cls.THEORETICAL_PATTERNS)
        is_vulnerable = not is_theoretical and finding.confidence >= 0.6 and bool(finding.affected_endpoint)

        # Question 3: Can the behavior be reproduced?
        evidences = finding.evidences.all()
        has_reproduction = any(bool(e.reproduction_steps) for e in evidences)
        is_reproducible = has_reproduction or finding.confidence >= 0.75

        # Question 4: Is the issue exploitable?
        is_exploitable = (
            finding.vulnerability_type in [
                "IDOR",
                "PRIVILEGE_ESCALATION",
                "BROKEN_ACCESS_CONTROL",
                "SQL_INJECTION",
                "COMMAND_INJECTION",
                "SSRF",
                "WEBSOCKET_UNAUTHORIZED_SUBSCRIPTION",
                "AUTH_BYPASS",
                "XSS",
                "UNAUTHENTICATED_API_ACCESS",
            ]
            and not is_theoretical
        )

        # Question 5: Is there meaningful security impact?
        # Healthcare: Confidentiality of patient records, integrity of risk predictions, availability of triage
        has_meaningful_impact = bool(finding.impact and len(finding.impact.strip()) > 10)

        # Question 6: Is the evidence sufficient?
        is_evidence_sufficient = evidences.exists() or bool(finding.description and finding.root_cause)

        # Question 7: Is the finding reportable?
        is_reportable = bool(
            is_target_authorized
            and is_vulnerable
            and is_reproducible
            and is_exploitable
            and has_meaningful_impact
            and is_evidence_sufficient
        )

        # Record or update SecurityValidation model
        validation, _ = SecurityValidation.objects.get_or_create(
            finding=finding,
            defaults={
                "validated_by": validator_user,
                "is_target_authorized": is_target_authorized,
                "is_vulnerable": is_vulnerable,
                "is_reproducible": is_reproducible,
                "is_exploitable": is_exploitable,
                "has_meaningful_impact": has_meaningful_impact,
                "is_evidence_sufficient": is_evidence_sufficient,
                "is_reportable": is_reportable,
                "validation_notes": validation_notes or "Automated 7-Question Validation Audit",
            },
        )

        validation.is_target_authorized = is_target_authorized
        validation.is_vulnerable = is_vulnerable
        validation.is_reproducible = is_reproducible
        validation.is_exploitable = is_exploitable
        validation.has_meaningful_impact = has_meaningful_impact
        validation.is_evidence_sufficient = is_evidence_sufficient
        validation.is_reportable = is_reportable
        validation.validation_notes = validation_notes or validation.validation_notes

        passed = validation.evaluate_gate()
        validation.save()

        # Update finding state
        if passed:
            finding.state = FindingState.VALIDATED
            logger.info(f"Finding {finding.id} PASSED 7-question validation gate. State -> VALIDATED")
        else:
            if is_theoretical:
                finding.state = FindingState.FALSE_POSITIVE
            elif not is_target_authorized:
                finding.state = FindingState.REJECTED
            else:
                finding.state = FindingState.FALSE_POSITIVE
            logger.warning(f"Finding {finding.id} FAILED 7-question validation gate. State -> {finding.state}")

        finding.save(update_fields=["state", "updated_at"])
        return passed, validation
