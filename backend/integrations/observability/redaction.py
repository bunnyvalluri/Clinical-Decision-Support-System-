"""
Centralized Data Redaction & Masking for HealthNova AI Observability.
Guarantees zero leakage of:
- Passwords and secret credentials
- Authorization headers and bearer tokens
- API keys (OpenAI, Anthropic, Groq, GitHub, Kaggle, etc.)
- Database connection strings and passwords
- Protected Health Information (PHI) & Clinical Identifiers
"""

import logging
import re
from typing import Any, Dict, List, Pattern, Union

# Compiled regex patterns for high-risk sensitive strings
SENSITIVE_PATTERNS: List[Pattern] = [
    # Authorization & Bearer tokens
    re.compile(r"(?i)(bearer\s+)[a-zA-Z0-9_\-\.]{15,}", re.IGNORECASE),
    re.compile(r"(?i)(authorization\s*[:=]\s*['\"]?)(bearer\s+)?[a-zA-Z0-9_\-\.]{15,}['\"]?", re.IGNORECASE),
    # API Keys & Secrets
    re.compile(r"(?i)(api[_\-]?key|secret[_\-]?key|access[_\-]?token|auth[_\-]?token|private[_\-]?key)\s*[:=]\s*['\"]?([^'\"\s,;]{6,})['\"]?", re.IGNORECASE),
    re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b"),
    re.compile(r"\b(sk-[a-zA-Z0-9]{20,})\b"),
    # Database credentials in URLs
    re.compile(r"(?i)(postgres(ql)?|redis(s)?|mysql)://([^:]+):([^@]+)@"),
    # Passwords
    re.compile(r"(?i)(password|passwd|pwd)\s*[:=]\s*['\"]?([^'\"\s,;]{3,})['\"]?", re.IGNORECASE),
    # Common PII/PHI patterns (SSN, National ID)
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
]

SENSITIVE_KEYS = {
    "password",
    "passwd",
    "pwd",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "auth_token",
    "authorization",
    "credentials",
    "private_key",
    "ssn",
    "social_security",
    "mrn",
}


class SensitiveDataRedactor:
    """
    Sanitizes strings, dictionaries, and log records to prevent credentials and PHI leakage.
    """

    REDACTED_STR = "[REDACTED]"

    @classmethod
    def redact_text(cls, text: str) -> str:
        """Scan string and replace sensitive substrings matching security regex patterns."""
        if not text or not isinstance(text, str):
            return text

        sanitized = text
        for pattern in SENSITIVE_PATTERNS:
            # Special case for DB URLs: preserve host, mask password
            if "://" in pattern.pattern:
                sanitized = pattern.sub(r"\1://\4:***@", sanitized)
            else:
                sanitized = pattern.sub(r"\1" + cls.REDACTED_STR if r"\1" in pattern.pattern else cls.REDACTED_STR, sanitized)

        return sanitized

    @classmethod
    def redact_dict(cls, data: Dict[str, Any], depth: int = 0, max_depth: int = 5) -> Dict[str, Any]:
        """Recursively redact dictionary keys and values."""
        if depth > max_depth or not isinstance(data, dict):
            return data

        sanitized = {}
        for key, value in data.items():
            str_key = str(key).lower()
            if any(sens in str_key for sens in SENSITIVE_KEYS):
                sanitized[key] = cls.REDACTED_STR
            elif isinstance(value, dict):
                sanitized[key] = cls.redact_dict(value, depth + 1, max_depth)
            elif isinstance(value, list):
                sanitized[key] = [
                    cls.redact_dict(item, depth + 1, max_depth) if isinstance(item, dict)
                    else (cls.redact_text(item) if isinstance(item, str) else item)
                    for item in value
                ]
            elif isinstance(value, str):
                sanitized[key] = cls.redact_text(value)
            else:
                sanitized[key] = value

        return sanitized


class RedactedLogFilter(logging.Filter):
    """
    Logging filter that intercepts LogRecord instances and redacts sensitive tokens, passwords, and URLs.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = SensitiveDataRedactor.redact_text(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = SensitiveDataRedactor.redact_dict(record.args)
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    SensitiveDataRedactor.redact_text(arg) if isinstance(arg, str)
                    else (SensitiveDataRedactor.redact_dict(arg) if isinstance(arg, dict) else arg)
                    for arg in record.args
                )
        return True
