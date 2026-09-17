"""
Unit tests for Security Retest Service.
"""
from django.test import TestCase
from django.utils import timezone
from apps.security_testing.models import (
    SecurityTarget,
    SecurityFinding,
    SecurityRemediation,
    ApprovalStatus,
    FindingState,
    SecurityEnvironment,
)
from apps.security_testing.services.retest import SecurityRetestService


class RetestServiceTestCase(TestCase):
    def setUp(self):
        self.target = SecurityTarget.objects.create(
            name="Retest Target",
            environment=SecurityEnvironment.SECURITY_TEST,
            hostname="127.0.0.1",
            approval_status=ApprovalStatus.APPROVED,
            approval_expires_at=timezone.now() + timezone.timedelta(days=1),
        )
        self.finding = SecurityFinding.objects.create(
            target=self.target,
            title="Broken Object Level Authorization on prediction endpoint",
            vulnerability_type="IDOR",
            affected_component="predictions.views.PredictionViewSet",
            affected_endpoint="/api/v1/predictions/999/",
            description="Unauthorized cross-tenant prediction retrieval.",
            impact="Unauthorized PHI read.",
            state=FindingState.FIXED,
        )

    def test_retest_transitions_to_resolved_when_remediation_verified(self):
        SecurityRemediation.objects.create(
            finding=self.finding,
            status="VERIFIED",
            commit_hash="a1b2c3d4e5f67890",
            remediation_notes="Added HasPatientAccess permission filter.",
        )
        retest = SecurityRetestService.execute_retest(self.finding)
        self.assertTrue(retest.passed)
        self.finding.refresh_from_db()
        self.assertEqual(self.finding.state, FindingState.RESOLVED)
        self.assertIsNotNone(self.finding.resolved_at)

    def test_retest_fails_and_transitions_to_remediation_required_without_fix(self):
        retest = SecurityRetestService.execute_retest(self.finding)
        self.assertFalse(retest.passed)
        self.finding.refresh_from_db()
        self.assertEqual(self.finding.state, FindingState.REMEDIATION_REQUIRED)
