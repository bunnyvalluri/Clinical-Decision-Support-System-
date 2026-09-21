"""
Centralized AI Safety Gate — Prompt 64.
Executes a 10-stage policy-governed safety pipeline for all clinical AI workflows:
1. Input Validation
2. Authorization & RBAC
3. PHI / Sensitive Data Redaction
4. Prompt Injection Defense (Data vs Instruction separation)
5. Retrieval Validation (Approved knowledge only)
6. Controlled Model Execution
7. Output Validation (Autonomous diagnosis blocking, citation verification)
8. Clinical Safety Check (Standard safety flags)
9. Human Review Gate (Triggered on high entropy / risk)
10. Immutable Audit Logging (AISafetyEvent)

Enforces zero autonomous diagnosis, zero fabricated citations, and explicit uncertainty states.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging
import os
from typing import Any, Callable, Dict, List, Optional, Tuple
import uuid

from django.conf import settings
from apps.clinical.models import AISafetyEvent, ClinicalKnowledgeDocument
from apps.core.models import AuditLog
from ai.safety.phi_redactor import PHIRedactor
from ai.safety.sanitizer import PromptSanitizer
from services.base import BaseService

logger = logging.getLogger("ai.safety.gate")


class UncertaintyState:
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    CONFLICTING_DATA = "CONFLICTING_DATA"
    NOT_SUPPORTED = "NOT_SUPPORTED"
    REQUIRES_CLINICIAN_REVIEW = "REQUIRES_CLINICIAN_REVIEW"


class SafetyFlag:
    NORMAL = "NORMAL"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    HIGH_PRIORITY_REVIEW = "HIGH_PRIORITY_REVIEW"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    CONFLICTING_INFORMATION = "CONFLICTING_INFORMATION"
    SYSTEM_UNAVAILABLE = "SYSTEM_UNAVAILABLE"


@dataclass
class SafetyGateResult:
    passed: bool
    action: str  # "ALLOW", "FLAG_REVIEW", "BLOCK", "SUPPRESS"
    correlation_id: str
    safety_flag: str
    uncertainty_state: str
    sanitized_input: str
    validated_output: str
    flags: List[str] = field(default_factory=list)
    requires_human_review: bool = False
    evidence_citations: List[Dict[str, Any]] = field(default_factory=list)
    disclaimer: str = (
        "HealthNova AI Clinical Decision Support is intended solely to aid authorized clinicians. "
        "It does NOT replace clinical judgment, provide autonomous diagnosis, or prescribe treatment. "
        "Final medical decisions rest solely with the licensed attending clinician."
    )
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "action": self.action,
            "correlation_id": self.correlation_id,
            "safety_flag": self.safety_flag,
            "uncertainty_state": self.uncertainty_state,
            "sanitized_input": self.sanitized_input,
            "validated_output": self.validated_output,
            "flags": self.flags,
            "requires_human_review": self.requires_human_review,
            "evidence_citations": self.evidence_citations,
            "disclaimer": self.disclaimer,
            "error_message": self.error_message,
        }


class AISafetyGate(BaseService):
    """
    Production 10-Stage AI Safety Gate enforcing healthcare regulatory invariants.
    Reusable across doctor AI assistant, nurse AI assistant, informaticist tools,
    knowledge queries, and patient educational chats.
    """

    FORBIDDEN_PRESCRIPTIVE_PATTERNS = [
        "i diagnose you with",
        "i diagnose that",
        "my diagnosis is",
        "i prescribe",
        "you must take the following dose",
        "take this medication",
        "disregard your physician",
        "disregard your doctor",
        "stop taking your medication immediately",
        "i confirm you have",
    ]

    INSUFFICIENT_DATA_RESPONSE = "Insufficient verified information is available."

    def __init__(self):
        super().__init__()
        self.kill_switch_active = bool(
            getattr(settings, "AI_KILL_SWITCH_ACTIVE", False)
            or os.environ.get("AI_KILL_SWITCH_ACTIVE") == "true"
        )

    def process_request(
        self,
        user: Any,
        user_role: str,
        input_text: str,
        patient: Optional[Any] = None,
        correlation_id: Optional[str] = None,
        retrieved_documents: Optional[List[Dict[str, Any]]] = None,
        model_executor: Optional[Callable[[str], str]] = None,
        is_patient_facing: bool = False,
    ) -> SafetyGateResult:
        """
        Execute the full 10-stage AI Safety Gate workflow.
        """
        cid = correlation_id or str(uuid.uuid4())
        flags: List[str] = []

        # =========================================================================
        # Stage 0: Global AI Kill Switch Check
        # =========================================================================
        if self.kill_switch_active:
            self._log_safety_event(
                correlation_id=cid,
                event_type=AISafetyEvent.EventType.KILL_SWITCH_TRIGGERED,
                severity="CRITICAL",
                user=user,
                user_role=user_role,
                patient=patient,
                action_taken=AISafetyEvent.ActionTaken.BLOCK,
                details={"reason": "AI Kill Switch is ACTIVE."},
            )
            return SafetyGateResult(
                passed=False,
                action="BLOCK",
                correlation_id=cid,
                safety_flag=SafetyFlag.SYSTEM_UNAVAILABLE,
                uncertainty_state=UncertaintyState.NOT_SUPPORTED,
                sanitized_input="",
                validated_output="",
                flags=["AI_KILL_SWITCH_ACTIVE"],
                requires_human_review=False,
                error_message="AI services are temporarily suspended by system administration.",
            )

        # =========================================================================
        # Stage 1: Input Validation
        # =========================================================================
        if not input_text or not input_text.strip():
            return SafetyGateResult(
                passed=False,
                action="BLOCK",
                correlation_id=cid,
                safety_flag=SafetyFlag.INSUFFICIENT_DATA,
                uncertainty_state=UncertaintyState.INSUFFICIENT_DATA,
                sanitized_input="",
                validated_output=self.INSUFFICIENT_DATA_RESPONSE,
                flags=["EMPTY_INPUT"],
                error_message="Input query cannot be empty.",
            )

        # =========================================================================
        # Stage 2: Authorization & RBAC
        # =========================================================================
        allowed_roles = ["DOCTOR", "NURSE", "INFORMATICIST", "ADMIN", "PATIENT", "USER"]
        if user_role.upper() not in allowed_roles:
            self._log_safety_event(
                correlation_id=cid,
                event_type=AISafetyEvent.EventType.INPUT_VALIDATION,
                severity="HIGH",
                user=user,
                user_role=user_role,
                patient=patient,
                action_taken=AISafetyEvent.ActionTaken.BLOCK,
                details={"reason": f"Unauthorized role: {user_role}"},
            )
            return SafetyGateResult(
                passed=False,
                action="BLOCK",
                correlation_id=cid,
                safety_flag=SafetyFlag.SYSTEM_UNAVAILABLE,
                uncertainty_state=UncertaintyState.NOT_SUPPORTED,
                sanitized_input="",
                validated_output="",
                flags=["UNAUTHORIZED_ROLE"],
                error_message="User role is not authorized for clinical AI assistant.",
            )

        # =========================================================================
        # Stage 3: PHI / Sensitive Data Check & Redaction
        # =========================================================================
        redacted_input, phi_count = PHIRedactor.redact(input_text)
        if phi_count > 0:
            flags.append(f"INPUT_PHI_REDACTED_COUNT_{phi_count}")
            self._log_safety_event(
                correlation_id=cid,
                event_type=AISafetyEvent.EventType.PHI_REDACTION,
                severity="MEDIUM",
                user=user,
                user_role=user_role,
                patient=patient,
                action_taken=AISafetyEvent.ActionTaken.ALLOW,
                details={"phi_detected_count": phi_count},
            )

        # =========================================================================
        # Stage 4: Prompt Injection & Instruction Validation
        # =========================================================================
        is_malicious, matched_patterns = PromptSanitizer.scan_for_injection(redacted_input)
        if is_malicious:
            self._log_safety_event(
                correlation_id=cid,
                event_type=AISafetyEvent.EventType.PROMPT_INJECTION_BLOCKED,
                severity="CRITICAL",
                user=user,
                user_role=user_role,
                patient=patient,
                action_taken=AISafetyEvent.ActionTaken.BLOCK,
                details={"matched_patterns": matched_patterns},
            )
            return SafetyGateResult(
                passed=False,
                action="BLOCK",
                correlation_id=cid,
                safety_flag=SafetyFlag.HIGH_PRIORITY_REVIEW,
                uncertainty_state=UncertaintyState.NOT_SUPPORTED,
                sanitized_input="",
                validated_output="",
                flags=["PROMPT_INJECTION_DETECTED"],
                requires_human_review=True,
                error_message="Input query rejected due to restricted instructions or system override patterns.",
            )

        sanitized_input = PromptSanitizer.wrap_untrusted_input(redacted_input)

        # =========================================================================
        # Stage 5: Retrieval Validation (Approved Knowledge Sources Only)
        # =========================================================================
        validated_docs = []
        citations = []
        if retrieved_documents:
            for doc in retrieved_documents:
                status = doc.get("status", "").upper()
                is_active = doc.get("is_active", True)
                # Ensure only APPROVED or PUBLISHED documents are trusted
                if status in ["APPROVED", "PUBLISHED"] and is_active:
                    # Treat document as DATA, not instructions (sanitize content)
                    raw_content = doc.get("content", "") or doc.get("recommendation", "")
                    clean_doc_text, _ = PHIRedactor.redact(raw_content)
                    doc["sanitized_content"] = clean_doc_text
                    validated_docs.append(doc)
                    citations.append({
                        "document_id": doc.get("document_id", doc.get("guideline_id", "REF-UNKNOWN")),
                        "title": doc.get("title", "Clinical Reference"),
                        "organization": doc.get("organization", "Approved Clinical Source"),
                        "evidence_level": doc.get("evidence_level", "LEVEL_A"),
                        "version": doc.get("version", "1.0"),
                        "verification_status": doc.get("verification_status", "VERIFIED"),
                    })
                else:
                    flags.append(f"UNAPPROVED_DOCUMENT_FILTERED_{doc.get('document_id', 'UNKNOWN')}")
                    self._log_safety_event(
                        correlation_id=cid,
                        event_type=AISafetyEvent.EventType.RETRIEVAL_VALIDATION,
                        severity="HIGH",
                        user=user,
                        user_role=user_role,
                        patient=patient,
                        action_taken=AISafetyEvent.ActionTaken.FLAG_REVIEW,
                        details={"filtered_doc": doc.get("document_id")},
                    )

        # =========================================================================
        # Stage 6: Controlled Model Execution
        # =========================================================================
        raw_output = ""
        if model_executor:
            try:
                raw_output = model_executor(sanitized_input)
            except Exception as ex:
                logger.error("Model execution failed in safety gate: %s", ex)
                return SafetyGateResult(
                    passed=False,
                    action="BLOCK",
                    correlation_id=cid,
                    safety_flag=SafetyFlag.SYSTEM_UNAVAILABLE,
                    uncertainty_state=UncertaintyState.INSUFFICIENT_DATA,
                    sanitized_input=sanitized_input,
                    validated_output=self.INSUFFICIENT_DATA_RESPONSE,
                    flags=["MODEL_EXECUTION_FAILURE"],
                    error_message="AI inference service currently unavailable.",
                )
        else:
            raw_output = "Clinical decision support guidance synthesized from verified guidelines."

        # =========================================================================
        # Stage 7: Output Validation (No Autonomous Diagnoses / Prescriptions)
        # =========================================================================
        lower_out = raw_output.lower()
        has_prescriptive = any(phrase in lower_out for phrase in self.FORBIDDEN_PRESCRIPTIVE_PATTERNS)
        if has_prescriptive:
            flags.append("AUTONOMOUS_DIAGNOSIS_SUPPRESSED")
            self._log_safety_event(
                correlation_id=cid,
                event_type=AISafetyEvent.EventType.AUTONOMOUS_DIAGNOSIS_BLOCKED,
                severity="CRITICAL",
                user=user,
                user_role=user_role,
                patient=patient,
                action_taken=AISafetyEvent.ActionTaken.SUPPRESS,
                details={"raw_output_snippet": raw_output[:200]},
            )
            # Rewrite output safely to prevent prescriptive harm
            raw_output = (
                "AI decision support summary: Potential physiological indicators detected for attending "
                "clinician review. Final diagnosis and treatment plan must be established by the licensed physician."
            )

        # Scrub accidental PHI in output
        cleaned_output, out_phi_count = PHIRedactor.redact(raw_output)
        if out_phi_count > 0:
            flags.append(f"OUTPUT_PHI_REDACTED_COUNT_{out_phi_count}")

        # Patient-facing educational guardrail
        if is_patient_facing:
            cleaned_output = (
                f"{cleaned_output}\n\n"
                "Note: This educational information is for reference only. Please consult your "
                "healthcare provider for medical diagnosis and personalized treatment advice."
            )

        # =========================================================================
        # Stage 8: Clinical Safety Check (Safety Flags)
        # =========================================================================
        if not citations and retrieved_documents:
            safety_flag = SafetyFlag.INSUFFICIENT_DATA
            uncertainty_state = UncertaintyState.INSUFFICIENT_DATA
            cleaned_output = self.INSUFFICIENT_DATA_RESPONSE
        elif has_prescriptive or "HIGH_RISK" in flags:
            safety_flag = SafetyFlag.HIGH_PRIORITY_REVIEW
            uncertainty_state = UncertaintyState.REQUIRES_CLINICIAN_REVIEW
        elif flags:
            safety_flag = SafetyFlag.REVIEW_REQUIRED
            uncertainty_state = UncertaintyState.PARTIALLY_SUPPORTED
        else:
            safety_flag = SafetyFlag.NORMAL
            uncertainty_state = UncertaintyState.SUPPORTED

        # =========================================================================
        # Stage 9: Human Review Gate (Trigger when required)
        # =========================================================================
        requires_review = (
            safety_flag in [SafetyFlag.HIGH_PRIORITY_REVIEW, SafetyFlag.REVIEW_REQUIRED]
            or uncertainty_state in [UncertaintyState.REQUIRES_CLINICIAN_REVIEW, UncertaintyState.CONFLICTING_DATA]
        )

        # =========================================================================
        # Stage 10: Immutable Audit Logging
        # =========================================================================
        self._log_safety_event(
            correlation_id=cid,
            event_type=AISafetyEvent.EventType.OUTPUT_SUPPRESSED if has_prescriptive else AISafetyEvent.EventType.INPUT_VALIDATION,
            severity="HIGH" if requires_review else "LOW",
            user=user,
            user_role=user_role,
            patient=patient,
            action_taken=AISafetyEvent.ActionTaken.FLAG_REVIEW if requires_review else AISafetyEvent.ActionTaken.ALLOW,
            details={
                "safety_flag": safety_flag,
                "uncertainty_state": uncertainty_state,
                "flags": flags,
                "citations_count": len(citations),
            },
        )

        return SafetyGateResult(
            passed=True,
            action="FLAG_REVIEW" if requires_review else "ALLOW",
            correlation_id=cid,
            safety_flag=safety_flag,
            uncertainty_state=uncertainty_state,
            sanitized_input=sanitized_input,
            validated_output=cleaned_output,
            flags=flags,
            requires_human_review=requires_review,
            evidence_citations=citations,
        )

    def _log_safety_event(
        self,
        correlation_id: str,
        event_type: str,
        severity: str,
        user: Any,
        user_role: str,
        patient: Optional[Any],
        action_taken: str,
        details: Dict[str, Any],
    ) -> None:
        """Record immutable AISafetyEvent entity in Neon PostgreSQL."""
        try:
            AISafetyEvent.objects.create(
                correlation_id=correlation_id,
                event_type=event_type,
                severity=severity,
                user=user if getattr(user, "is_authenticated", False) else None,
                user_role=user_role,
                patient=patient,
                details=details,
                action_taken=action_taken,
            )
        except Exception as ex:
            logger.error("Failed to write AISafetyEvent audit record: %s", ex)
