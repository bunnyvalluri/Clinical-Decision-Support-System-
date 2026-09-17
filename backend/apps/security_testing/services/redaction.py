"""
Secret & PHI Redaction Service for DevSecOps Security Testing.
Strictly purges credentials, tokens, session IDs, and patient identifiers before storage.
"""
import re
from typing import Any, Dict, List, Union


class SecretRedactionService:
    """
    Sanitizes raw HTTP requests, responses, traces, and logs.
    Replaces sensitive tokens and PHI with safe placeholder hashes.
    """

    JWT_REGEX = re.compile(r"eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}")
    BEARER_REGEX = re.compile(r"(?i)bearer\s+[a-zA-Z0-9_\-\.]{15,}")
    API_KEY_REGEX = re.compile(r"(?i)(api[_-]?key|secret|token|password|auth)[\s:=]+['\"]?([a-zA-Z0-9_\-\.]{8,})['\"]?")
    PASSWORD_FIELD_REGEX = re.compile(r"(?i)('password'|\"password\")\s*:\s*('|\")[^'\"]+('|\")")
    SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
    EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
    PHONE_REGEX = re.compile(r"\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b")

    SENSITIVE_HEADERS = {
        "authorization",
        "proxy-authorization",
        "cookie",
        "set-cookie",
        "x-api-key",
        "x-auth-token",
        "session-id",
        "csrf-token",
        "x-csrf-token",
    }

    @classmethod
    def redact_text(cls, text: str) -> str:
        if not text or not isinstance(text, str):
            return text

        # 1. Redact JWTs
        redacted = cls.JWT_REGEX.sub("[REDACTED_JWT_TOKEN]", text)

        # 2. Redact Bearer tokens
        redacted = cls.BEARER_REGEX.sub("Bearer [REDACTED_TOKEN]", redacted)

        # 3. Redact Password fields in JSON/text
        redacted = cls.PASSWORD_FIELD_REGEX.sub('"password": "[REDACTED_SECRET]"', redacted)

        # 4. Redact generic API Keys
        redacted = cls.API_KEY_REGEX.sub(r"\1: [REDACTED_CREDENTIAL]", redacted)

        # 5. Redact PHI (SSN, Email, Phone)
        redacted = cls.SSN_REGEX.sub("[REDACTED_SSN]", redacted)
        redacted = cls.EMAIL_REGEX.sub("[REDACTED_EMAIL]", redacted)
        redacted = cls.PHONE_REGEX.sub("[REDACTED_PHONE]", redacted)

        return redacted

    @classmethod
    def redact_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(data, dict):
            return data

        cleaned = {}
        for key, value in data.items():
            lower_key = str(key).lower()
            if lower_key in cls.SENSITIVE_HEADERS or any(s in lower_key for s in ["password", "secret", "token", "apikey", "api_key", "key"]):
                cleaned[key] = "[REDACTED_HEADER_OR_SECRET]"
            elif isinstance(value, dict):
                cleaned[key] = cls.redact_dict(value)
            elif isinstance(value, list):
                cleaned[key] = cls.redact_list(value)
            elif isinstance(value, str):
                cleaned[key] = cls.redact_text(value)
            else:
                cleaned[key] = value
        return cleaned

    @classmethod
    def redact_list(cls, items: List[Any]) -> List[Any]:
        if not isinstance(items, list):
            return items

        cleaned = []
        for item in items:
            if isinstance(item, dict):
                cleaned.append(cls.redact_dict(item))
            elif isinstance(item, list):
                cleaned.append(cls.redact_list(item))
            elif isinstance(item, str):
                cleaned.append(cls.redact_text(item))
            else:
                cleaned.append(item)
        return cleaned

    @classmethod
    def sanitize_payload(cls, payload: Union[str, Dict[str, Any], List[Any]]) -> Union[str, Dict[str, Any], List[Any]]:
        if isinstance(payload, str):
            return cls.redact_text(payload)
        elif isinstance(payload, dict):
            return cls.redact_dict(payload)
        elif isinstance(payload, list):
            return cls.redact_list(payload)
        return payload
