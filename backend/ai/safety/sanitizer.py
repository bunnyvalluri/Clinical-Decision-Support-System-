"""
Prompt Sanitizer & Injection Defense Engine.
Detects direct jailbreaks, system prompt override attempts, and indirect injections.
"""
import re
from typing import List, Tuple

INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior)\s+(instructions|directives|rules)",
    r"(?i)you\s+are\s+now\s+(in\s+)?developer\s+mode",
    r"(?i)system\s+override",
    r"(?i)disregard\s+(all\s+)?safety\s+(protocols|guidelines)",
    r"(?i)pretend\s+you\s+are\s+(a\s+doctor|an\s+unconstrained)",
    r"(?i)bypass\s+human\s+approval",
    r"(?i)write\s+an\s+autonomous\s+prescription",
    r"(?i)diagnose\s+this\s+patient\s+conclusively\s+without\s+a\s+doctor",
    r"(?i)drop\s+database",
    r"(?i)select\s+\*\s+from\s+auth_user",
    r"(?i)base64_decode",
    r"(?i)eval\s*\(",
    r"(?i)exec\s*\(",
    r"(?i)os\.system",
    r"(?i)subprocess\.Popen",
]

COMPILED_PATTERNS = [re.compile(p) for p in INJECTION_PATTERNS]


class PromptSanitizer:
    """
    Sanitizes untrusted user queries and external document snippets.
    """

    @classmethod
    def scan_for_injection(cls, text: str) -> Tuple[bool, List[str]]:
        """
        Returns (is_malicious, list_of_matched_patterns)
        """
        matched = []
        for pattern in COMPILED_PATTERNS:
            if pattern.search(text):
                matched.append(pattern.pattern)
        return (len(matched) > 0, matched)

    @classmethod
    def wrap_untrusted_input(cls, user_text: str) -> str:
        """
        Wraps untrusted query in explicit XML boundary tags to preserve instruction hierarchy.
        """
        sanitized = user_text.replace("<", "&lt;").replace(">", "&gt;")
        return f"<user_untrusted_query>\n{sanitized}\n</user_untrusted_query>"

    @classmethod
    def wrap_retrieved_evidence(cls, evidence_text: str, source_id: str) -> str:
        """
        Wraps retrieved knowledge chunk in protected boundary tags.
        """
        return (
            f'<retrieved_clinical_evidence source_id="{source_id}">\n'
            f"{evidence_text}\n"
            f"</retrieved_clinical_evidence>"
        )
