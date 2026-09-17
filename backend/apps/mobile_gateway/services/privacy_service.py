"""
Privacy & Security Data Classification Service.

Enforces:
1. Multi-tier classification: PUBLIC, LOW_SENSITIVITY, SENSITIVE, PHI, OTP, AUTHENTICATION_SECRET, FINANCIAL, UNKNOWN.
2. OTP Detection & default-blocking.
3. Authentication Secret Detection (API keys, private keys, JWTs, bearer tokens).
4. Protected Health Information (PHI) Detection & context minimization.
5. In-place Sanitization & Redaction.
6. Default-Deny rule: UNKNOWN is never forwarded.
"""
import re
from typing import Tuple
from apps.mobile_gateway.models import DataClassification, RiskLevel


class PrivacyClassificationService:
    # -------------------------------------------------------------------------
    # Regex Patterns for Sensitive Data Detection
    # -------------------------------------------------------------------------
    OTP_REGEX = re.compile(
        r"\b(?:verification\s*code|one-time\s*password|security\s*code|auth\s*code|pin|otp)\b[\s:=#\-]*(?:is\s+)?([a-z0-9]{4,8})\b|"
        r"\b([0-9]{4,8})\b\s*(?:is\s+your\s+(?:verification|security|login|otp|code))|"
        r"\b(?:your\s+code\s+is\s+)([0-9]{4,8})\b|"
        r"\b(?:otp|verification\s*code|one-time\s*password)\b.*?\b([0-9]{4,8})\b",
        re.IGNORECASE,
    )

    SECRET_PATTERNS = [
        re.compile(r"-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY-----"),
        re.compile(r"\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer\s+[a-z0-9\-_\.=]+|jwt|auth[_-]?token)\b[\s:=]+([a-z0-9\-_\.]{16,})", re.IGNORECASE),
        re.compile(r"\beyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_=]{10,}\b"),  # JWT pattern
        re.compile(r"\bpassword[\s:=]+([^\s,;]{6,})", re.IGNORECASE),
    ]

    FINANCIAL_PATTERNS = [
        re.compile(r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b"),  # Major Credit Cards
        re.compile(r"\b(?:cvv|cvc|security\s*code)[\s:=]+([0-9]{3,4})\b", re.IGNORECASE),
        re.compile(r"\b[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}\b"),  # IBAN
    ]

    PHI_PATTERNS = [
        re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN
        re.compile(r"\b(?:mrn|medical\s*record\s*(?:number|#)|patient\s*id)[\s:=#-]*([a-z0-9\-]{5,15})\b", re.IGNORECASE),
        re.compile(r"\b(?:diagnos(?:is|ed)|prescription|prescribed|dosage|biopsy|chemotherapy|hiv|oncology|psychiatric)\b", re.IGNORECASE),
        re.compile(r"\b(?:blood\s*pressure|glucose|heart\s*rate|spo2|vital\s*signs|icu\s*admission)\b", re.IGNORECASE),
    ]

    @classmethod
    def classify_and_sanitize(cls, content: str) -> Tuple[DataClassification, RiskLevel, str, bool]:
        """
        Evaluates message content.
        Returns:
            classification: DataClassification enum value
            risk_level: RiskLevel enum value
            sanitized_content: string with sensitive values replaced by redact markers
            requires_block: boolean indicating whether event must be strictly blocked
        """
        if not content or not content.strip():
            return DataClassification.UNKNOWN, RiskLevel.LOW, "", True

        text = content
        is_otp = False
        is_secret = False
        is_financial = False
        is_phi = False

        # 1. OTP Check
        if cls.OTP_REGEX.search(text):
            is_otp = True
            text = cls.OTP_REGEX.sub(r"[REDACTED_OTP]", text)

        # 2. Secret Check
        for pattern in cls.SECRET_PATTERNS:
            if pattern.search(text):
                is_secret = True
                text = pattern.sub(r"[REDACTED_SECRET]", text)

        # 3. Financial Check
        for pattern in cls.FINANCIAL_PATTERNS:
            if pattern.search(text):
                is_financial = True
                text = pattern.sub(r"[REDACTED_FINANCIAL]", text)

        # 4. PHI Check
        for pattern in cls.PHI_PATTERNS:
            if pattern.search(text):
                is_phi = True
                text = pattern.sub(r"[REDACTED_PHI]", text)

        # Multi-tiered classification hierarchy
        if is_secret:
            return DataClassification.AUTHENTICATION_SECRET, RiskLevel.CRITICAL, text, True
        if is_otp:
            # Default behavior: OTP = BLOCK
            return DataClassification.OTP, RiskLevel.HIGH, text, True
        if is_financial:
            return DataClassification.FINANCIAL, RiskLevel.HIGH, text, True
        if is_phi:
            return DataClassification.PHI, RiskLevel.HIGH, text, False

        # Operational / Low sensitivity heuristic: strictly operational telemetry
        if re.search(r"\b(?:battery|charging|wifi|heartbeat|online|offline|device\s+status|system\s+status|network\s+state)\b", text, re.IGNORECASE):
            return DataClassification.LOW_SENSITIVITY, RiskLevel.LOW, text, False

        if re.search(r"\b(?:calendar|appointment\s+reminder|routine\s+update)\b", text, re.IGNORECASE):
            return DataClassification.SENSITIVE, RiskLevel.MEDIUM, text, False

        # Default fallback: UNKNOWN (Default-deny)
        return DataClassification.UNKNOWN, RiskLevel.MEDIUM, text, True
