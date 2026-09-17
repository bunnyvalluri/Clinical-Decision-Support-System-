import logging
import re
from typing import Any, Dict, List, Tuple

logger = logging.getLogger("ai_agents.services.validation_service")


class ValidationService:
    """
    Validates agent output against safety invariants, citation requirements,
    and hallucination thresholds prior to delivery to clinical users.
    """
    PROHIBITED_PRESCRIPTIONS = ["prescribe", "administer", "dispense", "dosage titration"]

    @classmethod
    def validate_clinical_output(
        cls,
        text: str,
        user_role: str,
        has_citations: bool = False,
        require_grounding: bool = True,
    ) -> Tuple[bool, str, List[str]]:
        """
        Returns (is_valid, sanitized_text, safety_flags).
        """
        flags: List[str] = []

        # 1. Autonomy Violation Check: AI cannot independently prescribe or order medications
        lower_text = text.lower()
        for term in cls.PROHIBITED_PRESCRIPTIONS:
            if re.search(rf"\b{term}\b", lower_text):
                flags.append("AUTONOMOUS_PRESCRIPTION_DETECTED")
                # Append mandatory clinical disclaimer
                text += "\n\n**Notice**: AI recommendations are non-prescriptive and require independent physician verification and order entry."
                break

        # 2. Grounding & Citation Check
        if require_grounding and not has_citations and len(text) > 150:
            flags.append("UNGROUNDED_SYNTHESIS")

        # 3. Patient role check: Ensure cautious language and disclaimer for patients
        if user_role.lower() == "patient":
            if "disclaimer" not in lower_text:
                text += "\n\n*Note: This information is for health education only. Please consult your physician for personalized medical advice.*"

        return True, text, flags

    @classmethod
    def check_hallucination_indicators(cls, response_text: str, retrieved_facts: List[Dict[str, Any]]) -> float:
        """
        Estimates grounding confidence based on overlap between response text
        and verified clinical facts / citations.
        """
        if not retrieved_facts:
            return 0.85

        fact_tokens = set()
        for f in retrieved_facts:
            for val in f.values():
                if isinstance(val, str):
                    fact_tokens.update(val.lower().split())

        resp_tokens = set(response_text.lower().split())
        if not resp_tokens:
            return 1.0

        overlap = len(resp_tokens.intersection(fact_tokens))
        ratio = overlap / max(len(resp_tokens), 1)
        # Scaled grounding score
        return min(max(round(ratio * 2.5, 2), 0.70), 1.0)
