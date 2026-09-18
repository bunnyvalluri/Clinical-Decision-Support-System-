from django.test import SimpleTestCase
from integrations.jules.sanitizer import SensitiveDataSanitizer


class SensitiveDataSanitizerTests(SimpleTestCase):
    def test_sanitizes_api_keys_and_passwords(self):
        raw = "Error connecting to db: password: MySuperSecretPassword123 with api_key=AIzaSyA1234567890abcdef"
        sanitized = SensitiveDataSanitizer.sanitize_text(raw)
        self.assertNotIn("MySuperSecretPassword123", sanitized)
        self.assertIn("[REDACTED_SECRET]", sanitized)

    def test_sanitizes_jwt_tokens(self):
        jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        raw = f"Authorization header was Bearer {jwt}"
        sanitized = SensitiveDataSanitizer.sanitize_text(raw)
        self.assertNotIn(jwt, sanitized)
        self.assertIn("[REDACTED_JWT]", sanitized)

    def test_sanitizes_database_urls(self):
        raw = "DATABASE_URL=postgresql://postgres:secretpassword@ep-green-pond-1234.us-east-2.aws.neon.tech:5432/healthnova"
        sanitized = SensitiveDataSanitizer.sanitize_text(raw)
        self.assertNotIn("secretpassword", sanitized)
        self.assertIn("[REDACTED_DATABASE_URL]", sanitized)

    def test_sanitizes_phi(self):
        raw = "Patient log: patient_name='John Doe', personal SSN was 123-45-6789, phone 555-123-4567"
        sanitized = SensitiveDataSanitizer.sanitize_text(raw)
        self.assertNotIn("123-45-6789", sanitized)
        self.assertNotIn("John Doe", sanitized)
        self.assertIn("[REDACTED_SSN]", sanitized)
        self.assertIn("[REDACTED_PHI]", sanitized)

    def test_scan_for_secrets_detection(self):
        raw = "Found AWS key: AKIAIOSFODNN7EXAMPLE"
        has_secrets, findings = SensitiveDataSanitizer.scan_for_secrets(raw)
        self.assertTrue(has_secrets)
        self.assertGreater(len(findings), 0)
