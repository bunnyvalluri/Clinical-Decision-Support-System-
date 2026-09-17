"""
Unit tests for Secret & PHI Redaction Service.
"""
from django.test import SimpleTestCase
from apps.security_testing.services.redaction import SecretRedactionService


class SecretRedactionTestCase(SimpleTestCase):
    def test_jwt_redacted(self):
        text = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozG4201_mock_sig"
        redacted = SecretRedactionService.redact_text(text)
        self.assertNotIn("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", redacted)
        self.assertIn("[REDACTED", redacted)

    def test_passwords_and_keys_redacted_in_dict(self):
        payload = {
            "username": "tester",
            "password": "SuperSecretPassword123!",
            "api_key": "sk-proj-998877665544332211",
            "Authorization": "Bearer some_secret_token_value_12345",
        }
        cleaned = SecretRedactionService.redact_dict(payload)
        self.assertEqual(cleaned["username"], "tester")
        self.assertEqual(cleaned["password"], "[REDACTED_HEADER_OR_SECRET]")
        self.assertEqual(cleaned["api_key"], "[REDACTED_HEADER_OR_SECRET]")
        self.assertEqual(cleaned["Authorization"], "[REDACTED_HEADER_OR_SECRET]")

    def test_phi_redaction(self):
        phi_text = "Patient John Doe with SSN 123-45-6789 and email john.doe@hospital.test contacted triage."
        cleaned = SecretRedactionService.redact_text(phi_text)
        self.assertNotIn("123-45-6789", cleaned)
        self.assertNotIn("john.doe@hospital.test", cleaned)
        self.assertIn("[REDACTED_SSN]", cleaned)
        self.assertIn("[REDACTED_EMAIL]", cleaned)
