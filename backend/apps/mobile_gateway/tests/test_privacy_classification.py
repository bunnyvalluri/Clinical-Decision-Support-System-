import pytest
from apps.mobile_gateway.models import DataClassification, RiskLevel
from apps.mobile_gateway.services.privacy_service import PrivacyClassificationService


class TestPrivacyClassification:
    def test_otp_detection_and_blocking(self):
        content = "Your login verification code is 639201. Never disclose your OTP to anyone."
        classification, risk, sanitized, requires_block = (
            PrivacyClassificationService.classify_and_sanitize(content)
        )
        assert classification == DataClassification.OTP
        assert risk == RiskLevel.HIGH
        assert requires_block is True
        assert "[REDACTED_OTP]" in sanitized
        assert "639201" not in sanitized

    def test_secret_detection_and_blocking(self):
        content = "Connecting with api_key: a1b2c3d4e5f607182930415263748596 and secret"
        classification, risk, sanitized, requires_block = (
            PrivacyClassificationService.classify_and_sanitize(content)
        )
        assert classification == DataClassification.AUTHENTICATION_SECRET
        assert risk == RiskLevel.CRITICAL
        assert requires_block is True
        assert "[REDACTED_SECRET]" in sanitized

    def test_phi_redaction(self):
        content = "Patient MRN-44912 has abnormal glucose and needs prescription review"
        classification, risk, sanitized, requires_block = (
            PrivacyClassificationService.classify_and_sanitize(content)
        )
        assert classification == DataClassification.PHI
        assert risk == RiskLevel.HIGH
        assert requires_block is False  # PHI can be forwarded if approved policy exists and sanitized
        assert "[REDACTED_PHI]" in sanitized

    def test_financial_detection(self):
        content = "Payment completed with card 4532012345678910 and cvv 123"
        classification, risk, sanitized, requires_block = (
            PrivacyClassificationService.classify_and_sanitize(content)
        )
        assert classification == DataClassification.FINANCIAL
        assert requires_block is True
        assert "[REDACTED_FINANCIAL]" in sanitized

    def test_default_deny_on_unknown(self):
        content = "Arbitrary unclassified personal conversation that is not recognized"
        classification, risk, sanitized, requires_block = (
            PrivacyClassificationService.classify_and_sanitize(content)
        )
        assert classification == DataClassification.UNKNOWN
        assert requires_block is True
