"""
Sensitive Data Sanitizer and Secret Scanner for Google Jules Integration.
Scans and strips all API keys, credentials, tokens, and Protected Health Information (PHI)
before prompts, logs, or error traces are sent to Jules.
"""
import re
from typing import Tuple, List, Dict, Any


class SensitiveDataSanitizer:
    # Regex patterns for credentials and secrets
    SECRET_PATTERNS = [
        (r"(?i)(api[_-]?key|secret|password|passwd|token|auth[_-]?header|bearer)\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{8,})['\"]?", r"\1: [REDACTED_SECRET]"),
        (r"eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}", "[REDACTED_JWT]"),
        (r"(?i)postgres(?:ql)?://[a-zA-Z0-9_\-\.]+:[^@]+@[a-zA-Z0-9_\-\.]+:[0-9]+/[a-zA-Z0-9_\-\.]+", "[REDACTED_DATABASE_URL]"),
        (r"(?i)redis://:[^@]+@[a-zA-Z0-9_\-\.]+:[0-9]+", "[REDACTED_REDIS_URL]"),
        (r"(?i)AKIA[0-9A-Z]{16}", "[REDACTED_AWS_KEY]"),
        (r"(?i)ghp_[a-zA-Z0-9]{36}", "[REDACTED_GITHUB_TOKEN]"),
        (r"(?i)xox[baprs]-[0-9a-zA-Z]{10,48}", "[REDACTED_SLACK_TOKEN]"),
        (r"AIza[0-9A-Za-z-_]{35}", "[REDACTED_GOOGLE_API_KEY]"),
    ]

    # Regex patterns for accidental PHI (names, MRNs, SSNs, phone numbers)
    PHI_PATTERNS = [
        (r"(?i)(patient[_-]?name|patient[_-]?id|mrn|ssn)\s*[:=]\s*['\"]?([^,\n\r'\"]+)['\"]?", r"\1: [REDACTED_PHI]"),
        (r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED_SSN]"),
        (r"\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b", "[REDACTED_PHONE]"),
    ]

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """Sanitizes text by replacing all secret patterns and PHI."""
        if not text:
            return ""

        sanitized = text
        for pattern, replacement in cls.SECRET_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized)

        for pattern, replacement in cls.PHI_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized)

        return sanitized

    @classmethod
    def scan_for_secrets(cls, text: str) -> Tuple[bool, List[str]]:
        """
        Scans text for secrets. Returns (has_secrets, list_of_findings).
        Used as a safety gate to block transmission if unredacted secrets are detected.
        """
        if not text:
            return False, []

        findings = []
        for pattern, _ in cls.SECRET_PATTERNS:
            matches = re.findall(pattern, text)
            if matches:
                findings.append(f"Detected pattern: {pattern}")

        return len(findings) > 0, findings

    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively sanitizes dictionary strings."""
        sanitized = {}
        for k, v in data.items():
            if isinstance(v, str):
                sanitized[k] = cls.sanitize_text(v)
            elif isinstance(v, dict):
                sanitized[k] = cls.sanitize_dict(v)
            elif isinstance(v, list):
                sanitized[k] = [cls.sanitize_dict(item) if isinstance(item, dict) else (cls.sanitize_text(item) if isinstance(item, str) else item) for item in v]
            else:
                sanitized[k] = v
        return sanitized
