"""
AI Assistant & RAG Boundary Gate — BPY-CSE-2666 (Sections 26 & 27).
Enforces:
1. AI NEVER automatically modifies records, merges patients, approves mappings, diagnoses, or prescribes.
2. AI-generated explanations clearly distinguish SOURCE DATA from AI-GENERATED INTERPRETATION.
3. Strict data minimization and authorization before RAG retrieval.
4. ZERO unapproved PHI transmitted to external AI gateways.
"""
from typing import Any, Dict, List, Optional
import re

from apps.accounts.models import User
from apps.interoperability.domain.exceptions import FHIRSecurityError, InteroperabilityError
from apps.patients.models import Patient


class FHIRAIBoundaryGate:
    """
    Guards AI assistant interactions with FHIR data.
    Enforces authorization, context minimization, and non-autonomous boundaries.
    """

    PROHIBITED_AI_ACTIONS = {
        "MODIFY_CLINICAL_RECORD",
        "MERGE_PATIENTS",
        "APPROVE_MAPPING",
        "AUTONOMOUS_DIAGNOSIS",
        "AUTONOMOUS_PRESCRIPTION",
    }

    @classmethod
    def assert_action_permitted(cls, action_name: str) -> None:
        """Verify that an AI workflow is not attempting prohibited autonomous medical or administrative actions."""
        if action_name.upper() in cls.PROHIBITED_AI_ACTIONS:
            raise InteroperabilityError(
                f"AI Safety Invariant Violation: AI assistant is strictly prohibited from performing '{action_name}'. "
                f"Requires human clinician or informaticist sign-off."
            )

    @classmethod
    def prepare_minimized_rag_context(
        cls,
        patient: Patient,
        requesting_user: User,
        observations: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Extracts de-identified, minimized clinical context for AI decision-support explanation.
        Guarantees:
        - Patient names, MRN, phone, address, and contact info are STRIPPED.
        - Only numerical vitals and de-identified age/gender are supplied.
        - Verifies requesting user is authorized.
        """
        if not requesting_user or not requesting_user.is_authenticated:
            raise FHIRSecurityError("Unauthorized: Authentication required to retrieve clinical context for AI.")

        if not requesting_user.is_clinical_staff and not requesting_user.is_informaticist and not requesting_user.is_admin:
            raise FHIRSecurityError("Forbidden: User lacks clinical or informaticist role required for AI decision support.")

        # Data Minimization: strictly physiological parameters
        minimized_vitals = []
        if observations:
            for obs in observations[:15]:
                code_display = obs.get("code", {}).get("text") or obs.get("code", {}).get("coding", [{}])[0].get("display", "Observation")
                qty = obs.get("valueQuantity", {})
                minimized_vitals.append({
                    "measurement": code_display,
                    "value": qty.get("value"),
                    "unit": qty.get("unit"),
                })

        return {
            "source_type": "STANDARDS_BASED_FHIR_R4",
            "patient_age": patient.age,
            "patient_gender": patient.gender,
            "observations": minimized_vitals,
            "attribution": "De-identified HealthNova AI Clinical Record Snapshot",
        }

    @classmethod
    def format_ai_explanation(
        cls,
        source_data: Dict[str, Any],
        ai_interpretation: str,
        guideline_citations: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Packages AI response ensuring clear distinction between SOURCE DATA and AI-GENERATED INTERPRETATION.
        """
        return {
            "source_data": source_data,
            "ai_generated_interpretation": ai_interpretation.strip(),
            "guideline_citations": guideline_citations or [
                "HealthNova AI Clinical Practice Guideline Protocol v1.4.0",
                "ACC/AHA 2017 Hypertension Clinical Practice Guidelines",
            ],
            "disclaimer": (
                "CLINICAL DECISION SUPPORT NOTICE: This AI-generated interpretation is an advisory tool "
                "intended exclusively for qualified healthcare professionals. It does NOT constitute a medical "
                "diagnosis or prescription. Final clinical responsibility resides with the attending physician."
            ),
        }
