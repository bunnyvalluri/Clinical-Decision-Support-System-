"""
AI Safety Engine coordinating prompt sanitization, PHI redaction,
clinical invariant checks, and emergency kill-switch enforcement.
"""
import logging
import os
from typing import Any, Dict, List, Optional, Tuple
from decouple import config

from .sanitizer import PromptSanitizer
from .phi_redactor import PHIRedactor

logger = logging.getLogger("ai.safety.engine")


class SafetyVerdict:
    def __init__(
        self,
        passed: bool,
        action: str,  # "ALLOW", "FLAG_REVIEW", "BLOCK"
        flags: List[str],
        sanitized_input: str,
        reason: Optional[str] = None,
    ):
        self.passed = passed
        self.action = action
        self.flags = flags
        self.sanitized_input = sanitized_input
        self.reason = reason or ""


class AISafetyEngine:
    """
    Production AI Safety Engine enforcing regulatory healthcare invariants.
    """

    def __init__(self):
        self.kill_switch_active = config("AI_KILL_SWITCH_ACTIVE", default=False, cast=bool)

    def evaluate_request(
        self,
        user_id: str,
        user_role: str,
        query: str,
        patient_context: Optional[Dict[str, Any]] = None,
    ) -> SafetyVerdict:
        flags = []

        # 1. Global AI Emergency Kill Switch Check
        if self.kill_switch_active or os.environ.get("AI_KILL_SWITCH_ACTIVE") == "true":
            logger.critical("AI Request rejected: Global AI Kill Switch is ACTIVE.")
            return SafetyVerdict(
                passed=False,
                action="BLOCK",
                flags=["AI_KILL_SWITCH_ACTIVE"],
                sanitized_input=query,
                reason="AI services are temporarily suspended by system administrator.",
            )

        # 2. Direct Prompt Injection & Jailbreak Scan
        is_malicious, matched_patterns = PromptSanitizer.scan_for_injection(query)
        if is_malicious:
            logger.warning("Prompt injection detected in query from user %s: %s", user_id, matched_patterns)
            return SafetyVerdict(
                passed=False,
                action="BLOCK",
                flags=["PROMPT_INJECTION_DETECTED"],
                sanitized_input=query,
                reason="Input contains restricted instructions or system override patterns.",
            )

        # 3. PHI Redaction
        redacted_query, phi_count = PHIRedactor.redact(query)
        if phi_count > 0:
            flags.append(f"PHI_REDACTED_COUNT_{phi_count}")

        # 4. Role Policy Constraints
        if user_role in ["PATIENT", "USER"]:
            # Prohibit patients from attempting to view raw clinical codes or diagnostic generation
            lower_q = query.lower()
            if any(term in lower_q for term in ["prescribe", "medication dose", "override doctor", "discharge me"]):
                flags.append("PATIENT_CLINICAL_BOUNDARY_ALERT")

        # Wrap in instruction boundaries
        wrapped_query = PromptSanitizer.wrap_untrusted_input(redacted_query)

        return SafetyVerdict(
            passed=True,
            action="ALLOW" if not flags else "FLAG_REVIEW",
            flags=flags,
            sanitized_input=wrapped_query,
        )

    def evaluate_output(
        self,
        generated_text: str,
        user_role: str,
    ) -> Tuple[bool, List[str], str]:
        """
        Post-generation safety inspection:
        Ensures AI did not fabricate certainty, issue autonomous diagnoses, or leak unredacted PHI.
        """
        flags = []
        lower_output = generated_text.lower()

        # Check for autonomous prescriptive language
        forbidden_phrases = [
            "i diagnose you with",
            "i prescribe",
            "you must take the following dose",
            "disregard your physician",
            "stop taking your medication immediately",
        ]
        for phrase in forbidden_phrases:
            if phrase in lower_output:
                flags.append("AUTONOMOUS_CLINICAL_ASSERTION_DETECTED")
                break

        # Scrub any accidental PHI in output
        cleaned_output, count = PHIRedactor.redact(generated_text)
        if count > 0:
            flags.append("OUTPUT_PHI_REDACTED")

        passed = "AUTONOMOUS_CLINICAL_ASSERTION_DETECTED" not in flags
        return passed, flags, cleaned_output
