"""
PHI Redaction and Context Minimization Utilities.
Scrubs direct patient identifiers (SSNs, MRNs, phone numbers, emails, addresses).
"""
import re
from typing import Tuple

# Regex patterns for Protected Health Information (PHI)
SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
PHONE_PATTERN = re.compile(r"\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
MRN_PATTERN = re.compile(r"\b(?:MRN|mrn|RECORD|record)[:#\s]*([A-Z0-9]{6,10})\b")
ZIP_PATTERN = re.compile(r"\b\d{5}(?:-\d{4})?\b")


class PHIRedactor:
    """
    Scans and redacts PHI entities before sending to external LLMs or audit logs.
    """

    @classmethod
    def redact(cls, text: str) -> Tuple[str, int]:
        """
        Replaces PHI with standardized redaction tokens.
        Returns (redacted_text, redaction_count)
        """
        count = 0

        def repl_ssn(m):
            nonlocal count
            count += 1
            return "[REDACTED_SSN]"

        def repl_phone(m):
            nonlocal count
            count += 1
            return "[REDACTED_PHONE]"

        def repl_email(m):
            nonlocal count
            count += 1
            return "[REDACTED_EMAIL]"

        def repl_mrn(m):
            nonlocal count
            count += 1
            return "MRN:[REDACTED_MRN]"

        cleaned = SSN_PATTERN.sub(repl_ssn, text)
        cleaned = PHONE_PATTERN.sub(repl_phone, cleaned)
        cleaned = EMAIL_PATTERN.sub(repl_email, cleaned)
        cleaned = MRN_PATTERN.sub(repl_mrn, cleaned)

        return cleaned, count
