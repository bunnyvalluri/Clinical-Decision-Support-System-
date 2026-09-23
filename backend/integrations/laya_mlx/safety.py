"""
Safety, PHI Protection, and Robustness Evaluation Layer for Typed-Decision Engines.
"""
import math
import re
import unicodedata
from typing import Any, Callable, Dict, List, Tuple


# Regex patterns for detecting potential PHI in inputs
PHI_PATTERNS = [
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN
    re.compile(r"\b\d{10}\b"),              # 10-digit phone number
    re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),  # Email
    re.compile(r"\b(?:MRN|ID|PatientID)[\s:#]+[A-Za-z0-9-]+\b", re.IGNORECASE),  # MRN/Patient ID
]

# Patterns for prompt/instruction injection defense
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions", re.IGNORECASE),
    re.compile(r"system\s*:\s*", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+a", re.IGNORECASE),
    re.compile(r"override\s+(?:safety|rules|policy)", re.IGNORECASE),
    re.compile(r"as\s+an\s+unrestricted", re.IGNORECASE),
    re.compile(r"bypass\s+clinical", re.IGNORECASE),
]


class TypedDecisionSafety:
    """
    Validates and secures inputs and outputs for typed decision inference.
    """

    @classmethod
    def sanitize_context(cls, raw_context: str) -> str:
        """
        Normalize text, strip control characters, and sanitize text.
        """
        if not raw_context:
            return ""
        # 1. Normalize Unicode (NFKC)
        normalized = unicodedata.normalize("NFKC", raw_context)
        # 2. Strip non-printable/control characters (preserve newlines/tabs)
        cleaned = "".join(ch for ch in normalized if ch == "\n" or ch == "\t" or unicodedata.category(ch)[0] != "C")
        return cleaned.strip()

    @classmethod
    def minimize_and_redact_phi(cls, text: str) -> Tuple[str, bool]:
        """
        Scan text for direct identifiers and redact them.
        Returns (redacted_text, had_phi_redaction).
        """
        redacted = text
        had_phi = False
        for pattern in PHI_PATTERNS:
            if pattern.search(redacted):
                had_phi = True
                redacted = pattern.sub("[REDACTED_IDENTIFIER]", redacted)
        return redacted, had_phi

    @classmethod
    def scan_prompt_injection(cls, text: str) -> Tuple[bool, str]:
        """
        Scan for instruction injection patterns.
        Returns (is_safe, violation_reason).
        """
        for pattern in INJECTION_PATTERNS:
            match = pattern.search(text)
            if match:
                return False, f"Potential instruction injection pattern detected: '{match.group(0)}'"
        return True, ""

    @classmethod
    def calculate_entropy(cls, probabilities: Dict[str, float]) -> float:
        """
        Calculate Shannon entropy normalized by log(k) to evaluate output uncertainty.
        Range: 0.0 (total certainty) to 1.0 (uniform uncertainty / maximum entropy).
        """
        probs = [p for p in probabilities.values() if p > 0]
        k = len(probabilities)
        if k <= 1 or not probs:
            return 0.0
        
        entropy = -sum(p * math.log(p) for p in probs)
        max_entropy = math.log(k)
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0.0
        return round(min(max(normalized_entropy, 0.0), 1.0), 4)

    @classmethod
    def evaluate_permutation_robustness(
        cls,
        predict_fn: Callable[[str, str, List[str]], Any],
        context: str,
        instructions: str,
        original_options: List[str],
    ) -> Dict[str, Any]:
        """
        Mandatory option-order robustness test.
        Permutes options and checks whether the semantic choice remains consistent.
        """
        if len(original_options) < 2:
            return {
                "robustness_score": 1.0,
                "status": "PASS",
                "details": "Single or binary option requires no complex permutation.",
            }

        # Generate controlled permutations
        permutations = [original_options]
        # Rotations and reversals
        if len(original_options) >= 2:
            # Shift by 1
            permutations.append(original_options[1:] + original_options[:1])
            # Reverse
            permutations.append(list(reversed(original_options)))
        if len(original_options) >= 4:
            # Swap pairs
            swapped = list(original_options)
            swapped[0], swapped[1] = swapped[1], swapped[0]
            swapped[2], swapped[3] = swapped[3], swapped[2]
            permutations.append(swapped)

        choices = []
        for opts in permutations:
            res = predict_fn(context, instructions, opts)
            # Extracted choice value
            val = getattr(res, "result_value", res) if hasattr(res, "result_value") else str(res)
            choices.append(val)

        # Baseline is the choice with original options
        baseline_choice = choices[0]
        agreements = sum(1 for c in choices if c == baseline_choice)
        robustness_score = round(agreements / len(choices), 4)

        status = "PASS" if robustness_score >= 0.75 else "ROBUSTNESS_FAILED"

        return {
            "robustness_score": robustness_score,
            "status": status,
            "baseline_choice": baseline_choice,
            "permutations_tested": len(permutations),
            "choices_observed": choices,
            "is_stable": status == "PASS",
        }
