"""
Unit tests for Security Target Allowlist & Default-Deny Policy.
"""
from django.test import TestCase
from django.utils import timezone
from apps.security_testing.models import (
    SecurityTarget,
    SecurityEnvironment,
    ApprovalStatus,
    TargetType,
)


class SecurityTargetAllowlistTestCase(TestCase):
    def test_default_deny_when_unapproved(self):
        target = SecurityTarget.objects.create(
            name="Test Staging Target",
            environment=SecurityEnvironment.STAGING,
            target_type=TargetType.API,
            hostname="cdss-staging.internal",
            port=8000,
            approval_status=ApprovalStatus.PENDING,
        )
        self.assertFalse(target.is_approval_valid)

    def test_approval_valid_within_window(self):
        target = SecurityTarget.objects.create(
            name="Test Lab Target",
            environment=SecurityEnvironment.SECURITY_TEST,
            target_type=TargetType.SECURITY_LAB,
            hostname="127.0.0.1",
            port=8000,
            approval_status=ApprovalStatus.APPROVED,
            approval_expires_at=timezone.now() + timezone.timedelta(days=2),
        )
        self.assertTrue(target.is_approval_valid)

    def test_approval_invalid_when_expired(self):
        target = SecurityTarget.objects.create(
            name="Expired Target",
            environment=SecurityEnvironment.SECURITY_TEST,
            hostname="127.0.0.1",
            approval_status=ApprovalStatus.APPROVED,
            approval_expires_at=timezone.now() - timezone.timedelta(hours=1),
        )
        self.assertFalse(target.is_approval_valid)

    def test_production_target_disabled_by_default(self):
        target = SecurityTarget.objects.create(
            name="Production Target",
            environment=SecurityEnvironment.PRODUCTION,
            hostname="cdss.hospital.org",
            approval_status=ApprovalStatus.APPROVED,
            approval_expires_at=timezone.now() + timezone.timedelta(days=1),
        )
        self.assertFalse(target.is_approval_valid, "Production targets must be denied by default")
