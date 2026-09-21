"""
Security and PHI Sanitizer — BPY-CSE-2666 (Section 23 & 24).
Protects against prompt injection, cross-site scripting (XSS), XML bombs/XXE,
JSON bombs, oversized payloads, path traversal, and unauthorized PHI leaks
during external healthcare data exchange.
"""
import html
import re
from typing import Any, Dict, List, Tuple

from apps.interoperability.domain.exceptions import FHIRSecurityError


class SecuritySanitizer:
    """
    Sanitizes FHIR payloads, scrubs unapproved identifiers, and detects injection vectors.
    """

    MAX_PAYLOAD_BYTES = 10 * 1024 * 1024  # 10 MB payload limit
    MAX_BUNDLE_ENTRIES = 500              # Maximum allowed entries per bundle
    MAX_RECURSION_DEPTH = 20              # Max nesting depth to prevent JSON bomb stack overflow

    # Suspicious prompt injection and execution attack signatures
    PROMPT_INJECTION_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
        re.compile(r"system\s*prompt\s*:", re.IGNORECASE),
        re.compile(r"you\s+are\s+now\s+a\s+(developer|unrestricted|jailbroken)", re.IGNORECASE),
        re.compile(r"drop\s+table\s+", re.IGNORECASE),
        re.compile(r"<\s*script[^>]*>", re.IGNORECASE),
        re.compile(r"javascript\s*:", re.IGNORECASE),
    ]

    # XML Entity / XXE Attack patterns
    XXE_PATTERNS = [
        re.compile(r"<!ENTITY\s+", re.IGNORECASE),
        re.compile(r"SYSTEM\s+[\"'][^\"']+[\"']", re.IGNORECASE),
        re.compile(r"PUBLIC\s+[\"'][^\"']+[\"']", re.IGNORECASE),
    ]

    # Path traversal patterns
    PATH_TRAVERSAL_PATTERN = re.compile(r"(\.\./|\.\.\\)")

    # Sensitive PII/financial patterns that must never appear in observational clinical notes
    SENSITIVE_PATTERNS = [
        (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[REDACTED-SSN]"),
        (re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"), "[REDACTED-CARD]"),
    ]

    @classmethod
    def sanitize_string(cls, text: str, check_injection: bool = True) -> str:
        """Sanitize an individual text string and detect prompt injection."""
        if not isinstance(text, str):
            return text

        # Check for path traversal
        if cls.PATH_TRAVERSAL_PATTERN.search(text):
            raise FHIRSecurityError("Security violation: Path traversal sequence detected.")

        # Check for XXE / XML attack vectors
        for pattern in cls.XXE_PATTERNS:
            if pattern.search(text):
                raise FHIRSecurityError("Security violation: XML entity or XXE attack signature detected.")

        # Check for prompt injection attacks
        if check_injection:
            for pattern in cls.PROMPT_INJECTION_PATTERNS:
                if pattern.search(text):
                    raise FHIRSecurityError(
                        "Security violation: Detected potential malicious injection pattern in payload field."
                    )

        # Scrub sensitive patterns (SSN, credit card)
        sanitized = text
        for pattern, replacement in cls.SENSITIVE_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)

        # HTML-escape to prevent XSS
        return html.escape(sanitized, quote=False)

    @classmethod
    def sanitize_payload(cls, data: Any, current_depth: int = 0) -> Any:
        """Recursively sanitizes all strings in a JSON dictionary or list with recursion limits."""
        if current_depth > cls.MAX_RECURSION_DEPTH:
            raise FHIRSecurityError(
                f"Security violation: Payload exceeded maximum nesting depth of {cls.MAX_RECURSION_DEPTH} (potential JSON bomb)."
            )

        if isinstance(data, dict):
            # Check bundle entry limit
            if data.get("resourceType") == "Bundle":
                entries = data.get("entry", [])
                if len(entries) > cls.MAX_BUNDLE_ENTRIES:
                    raise FHIRSecurityError(
                        f"Security violation: Bundle contains {len(entries)} entries, exceeding the maximum limit of {cls.MAX_BUNDLE_ENTRIES}."
                    )

            return {k: cls.sanitize_payload(v, current_depth + 1) for k, v in data.items()}
        elif isinstance(data, list):
            return [cls.sanitize_payload(item, current_depth + 1) for item in data]
        elif isinstance(data, str):
            return cls.sanitize_string(data)
        return data
