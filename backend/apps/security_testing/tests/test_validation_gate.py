"""
Unit tests for 7-Question Validation Gate.
"""
from django.test import TestCase
from django.utils import timezone
from apps.security_testing.models import (
    SecurityTarget,
    SecurityFinding,
    SecurityEvidence,
    ApprovalStatus,
    FindingState,
    SecurityEnvironment,
)
from apps.security_testing.services.validation_gate import FindingValidationService


class ValidationGateTestCase(TestCase):
    def setUp(self):
        self.approved_target = SecurityTarget.objects.create(
            name="Lab Target",
            environment=SecurityEnvironment.SECURITY_TEST,
            hostname="127.0.0.1",
            approval_status=ApprovalStatus.APPROVED,
            approval_expires_at=timezone.now() + timezone.timedelta(days=1),
        )

    def test_theoretical_finding_filtered_as_false_positive(self):
        finding = SecurityFinding.objects.create(
            target=self.approved_target,
            title="Missing X-Frame-Options header on healthcheck",
            vulnerability_type="MISSING_HEADER",
            affected_component="core.views.health_check",
            affected_endpoint="/api/v1/health/",
            description="Informational scanner warning regarding header.",
            impact="Minimal risk.",
            confidence=0.4,
            state=FindingState.DISCOVERED,
        )
        passed, validation = FindingValidationService.evaluate_finding(finding)
        self.assertFalse(passed)
        self.assertEqual(validation.decision, "FALSE_POSITIVE")
        self.assertEqual(finding.state, FindingState.FALSE_POSITIVE)

    def test_reproducible_finding_passes_validation_gate(self):
        finding = SecurityFinding.objects.create(
            target=self.approved_target,
            title="Insecure Direct Object Reference on /api/v1/patients/detail/",
            vulnerability_type="IDOR",
            affected_component="patients.views.PatientViewSet",
            affected_endpoint="/api/v1/patients/123/",
            description="Patient record accessed across different clinician tenancy boundary.",
            impact="Unauthorized disclosure of patient demographic records.",
            root_cause="Missing tenancy filter in queryset.",
            remediation_guidance="Enforce request.user.assigned_patients filtering.",
            confidence=0.95,
            state=FindingState.DISCOVERED,
        )
        SecurityEvidence.objects.create(
            finding=finding,
            evidence_type="REPRODUCTION_POC",
            reproduction_steps="GET /api/v1/patients/123/ with Clinician B token returns 200 OK.",
        )
        passed, validation = FindingValidationService.evaluate_finding(finding)
        self.assertTrue(passed)
        self.assertEqual(validation.decision, "VALIDATED")
        self.assertEqual(finding.state, FindingState.VALIDATED)
