"""
Unit tests for 5-Role Security Permissions.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import UserRole
from apps.security_testing.models import SecurityTarget, SecurityEnvironment, ApprovalStatus

User = get_user_model()


class FiveRoleSecurityPermissionTestCase(APITestCase):
    def setUp(self):
        self.patient = User.objects.create_user(username="test_patient", email="patient@hospital.test", password="Password123!", role=UserRole.PATIENT)
        self.doctor = User.objects.create_user(username="test_doctor", email="doctor@hospital.test", password="Password123!", role=UserRole.DOCTOR)
        self.nurse = User.objects.create_user(username="test_nurse", email="nurse@hospital.test", password="Password123!", role=UserRole.NURSE)
        self.informaticist = User.objects.create_user(username="test_info", email="info@hospital.test", password="Password123!", role=UserRole.MEDICAL_INFORMATICIST)
        self.it_admin = User.objects.create_user(username="test_admin", email="admin@hospital.test", password="Password123!", role=UserRole.IT_ADMIN)

        self.target = SecurityTarget.objects.create(
            name="API Target",
            environment=SecurityEnvironment.SECURITY_TEST,
            hostname="127.0.0.1",
            approval_status=ApprovalStatus.APPROVED,
        )

    def test_patient_completely_blocked(self):
        self.client.force_authenticate(user=self.patient)
        resp = self.client.get("/api/v1/security/targets/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        resp2 = self.client.get("/api/v1/security/scans/")
        self.assertEqual(resp2.status_code, status.HTTP_403_FORBIDDEN)
        resp3 = self.client.get("/api/v1/security/findings/")
        self.assertEqual(resp3.status_code, status.HTTP_403_FORBIDDEN)

    def test_doctor_completely_blocked(self):
        self.client.force_authenticate(user=self.doctor)
        resp = self.client.get("/api/v1/security/targets/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        resp2 = self.client.get("/api/v1/security/scans/")
        self.assertEqual(resp2.status_code, status.HTTP_403_FORBIDDEN)

    def test_nurse_completely_blocked(self):
        self.client.force_authenticate(user=self.nurse)
        resp = self.client.get("/api/v1/security/targets/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        resp2 = self.client.get("/api/v1/security/scans/")
        self.assertEqual(resp2.status_code, status.HTTP_403_FORBIDDEN)

    def test_informaticist_read_only_findings(self):
        self.client.force_authenticate(user=self.informaticist)
        # Findings read allowed
        resp = self.client.get("/api/v1/security/findings/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Scans or targets creation forbidden
        resp2 = self.client.post("/api/v1/security/scans/", {"target": str(self.target.id), "scan_type": "API_SECURITY"})
        self.assertEqual(resp2.status_code, status.HTTP_403_FORBIDDEN)

    def test_it_admin_full_access(self):
        self.client.force_authenticate(user=self.it_admin)
        resp = self.client.get("/api/v1/security/targets/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp2 = self.client.get("/api/v1/security/scans/")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        resp3 = self.client.get("/api/v1/security/findings/")
        self.assertEqual(resp3.status_code, status.HTTP_200_OK)
