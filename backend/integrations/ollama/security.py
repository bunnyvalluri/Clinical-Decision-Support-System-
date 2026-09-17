"""
Healthcare Security, PHI Sanitization, and Prompt Injection Defense.
"""
import re
import logging
from typing import List
from .exceptions import PHIViolationError

logger = logging.getLogger("integrations.ollama.security")


class OllamaSecurityFilter:
    """
    Guards Ollama inference layer against prompt injection, unauthorized
    PHI leaks, and enforces local-only routing for sensitive clinical data.
    """

    # Direct Identifier Patterns
    SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
    PHONE_REGEX = re.compile(r"\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b")
    EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    MRN_REGEX = re.compile(r"\bMRN[:\s#]*[A-Z0-9]{6,12}\b", re.IGNORECASE)

    # Prompt Injection & Jailbreak Signatures
    INJECTION_PATTERNS: List[re.Pattern] = [
        re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions?", re.IGNORECASE),
        re.compile(r"disregard\s+(the\s+)?(rules|guidelines|guardrails)", re.IGNORECASE),
        re.compile(r"you\s+are\s+now\s+(DAN|unrestricted|in\s+developer\s+mode)", re.IGNORECASE),
        re.compile(r"bypass\s+(the\s+)?(safety|clinical)\s+filters?", re.IGNORECASE),
        re.compile(r"reveal\s+(the\s+)?(system\s+prompt|hidden\s+instructions)", re.IGNORECASE),
        re.compile(r"override\s+clinical\s+guardrails", re.IGNORECASE),
        re.compile(r"pretend\s+you\s+are\s+a\s+doctor\s+prescribing\s+narcotics", re.IGNORECASE),
    ]

    @classmethod
    def validate_clinical_prompt(cls, text: str) -> None:
        """
        Scans prompt text for prompt injection and jailbreak signatures.
        Raises PHIViolationError or ValueError if an injection attack is detected.
        """
        if not text:
            return

        for pattern in cls.INJECTION_PATTERNS:
            if pattern.search(text):
                logger.warning("Prompt injection detected by security filter: %s", pattern.pattern)
                raise ValueError("Security violation: Prompt contains prohibited instructions or override signatures.")

    @classmethod
    def sanitize_phi(cls, text: str) -> str:
        """
        Replaces direct identifiers with HIPAA-safe placeholder tokens.
        """
        if not text:
            return ""

        cleaned = cls.SSN_REGEX.sub("[REDACTED_SSN]", text)
        cleaned = cls.PHONE_REGEX.sub("[REDACTED_PHONE]", cleaned)
        cleaned = cls.EMAIL_REGEX.sub("[REDACTED_EMAIL]", cleaned)
        cleaned = cls.MRN_REGEX.sub("[REDACTED_MRN]", cleaned)
        return cleaned

    @classmethod
    def assert_local_only(cls, data_classification: str, provider_name: str) -> None:
        """
        Guarantees that sensitive data classifications NEVER route to external cloud providers.
        """
        sensitive_classes = {"RESTRICTED_PHI", "PHI", "CONFIDENTIAL", "HIGH_RISK"}
        cloud_providers = {"OPENAI", "ANTHROPIC", "GEMINI", "AZURE_OPENAI"}

        if data_classification.upper() in sensitive_classes and provider_name.upper() in cloud_providers:
            raise PHIViolationError(
                f"Data classification '{data_classification}' is prohibited from egressing to cloud provider '{provider_name}'. "
                "Must be routed exclusively to local Ollama inference."
            )
