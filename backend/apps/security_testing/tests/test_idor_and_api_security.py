"""
Unit tests for IDOR and API Security testing boundaries.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import UserRole
from apps.security_testing.models import SecurityTarget, SecurityScan, SecurityEnvironment, ApprovalStatus

User = get_user_model()


class IdorAndApiSecurityTestCase(APITestCase):
    def setUp(self):
        self.it_admin = User.objects.create_user(
            username="sec_admin",
            email="sec_admin@hospital.test",
            password="Password123!",
            role=UserRole.IT_ADMIN,
        )
        self.approved_target = SecurityTarget.objects.create(
            name="Hospital Staging Internal API",
            environment=SecurityEnvironment.SECURITY_TEST,
            hostname="127.0.0.1",
            port=8000,
            protocol="http",
            approval_status=ApprovalStatus.APPROVED,
        )

    def test_idor_cross_tenant_scan_isolation(self):
        self.client.force_authenticate(user=self.it_admin)
        scan = SecurityScan.objects.create(
            target=self.approved_target,
            scan_type="IDOR",
            initiated_by=self.it_admin,
        )
        resp = self.client.get(f"/api/v1/security/scans/{scan.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["scan_type"], "IDOR")

    def test_unapproved_target_cannot_be_scanned(self):
        self.client.force_authenticate(user=self.it_admin)
        unapproved = SecurityTarget.objects.create(
            name="Unapproved Target",
            environment=SecurityEnvironment.STAGING,
            hostname="staging-hack.internal",
            approval_status=ApprovalStatus.PENDING,
        )
        scan = SecurityScan.objects.create(
            target=unapproved,
            scan_type="API_SECURITY",
            initiated_by=self.it_admin,
        )
        # Attempting start should block
        resp = self.client.post(f"/api/v1/security/scans/{scan.id}/start/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "BLOCKED")
