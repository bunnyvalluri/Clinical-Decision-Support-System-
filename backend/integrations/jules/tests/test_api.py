from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class JulesApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="admin@healthnova.ai",
            email="admin@healthnova.ai",
            password="testpassword123",
            role="IT_ADMIN",
        )
        self.doctor_user = User.objects.create_user(
            username="doctor@healthnova.ai",
            email="doctor@healthnova.ai",
            password="testpassword123",
            role="DOCTOR",
        )

    def test_health_unauthenticated_returns_401(self):
        resp = self.client.get("/api/v1/automation/jules/health/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_health_doctor_returns_403(self):
        self.client.force_authenticate(user=self.doctor_user)
        resp = self.client.get("/api/v1/automation/jules/health/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_health_admin_returns_200_without_api_key(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get("/api/v1/automation/jules/health/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("service", resp.data)
        self.assertEqual(resp.data["service"], "jules")
        # Assert API key is NEVER exposed in the response
        self.assertNotIn("api_key", resp.data)
        self.assertNotIn("JULES_API_KEY", str(resp.content))

    def test_settings_admin_returns_settings(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get("/api/v1/automation/jules/settings/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("enabled", resp.data)
        self.assertNotIn("api_key", resp.data)

    def test_create_remediation_job_api(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "title": "Fix Broken Link in Public Solutions Nav",
            "issue_category": "UI_ERROR",
            "description": "Navigation link needs to target /solutions.",
            "repository": "HealthNova-AI",
            "branch": "develop",
            "severity": "LOW",
        }
        resp = self.client.post("/api/v1/automation/jules/remediations/", data=payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("correlation_id", resp.data)
