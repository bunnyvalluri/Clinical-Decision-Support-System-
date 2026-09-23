"""
Independent Outcome Verifier for Browser Agent Tasks.

MANDATORY SAFETY PRINCIPLE:
A Laya model 'DONE' decision is NEVER proof of success.
The final page DOM, text state, and URL must be independently verified
against pre-defined verification rules.
"""
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from apps.ai_agents.models import VerificationStatus

logger = logging.getLogger("ai_agents.verifier")


class BrowserOutcomeVerifier:
    """
    Independent verification engine. Evaluates final browser state against objective post-conditions.
    """

    @classmethod
    def verify_outcome(
        cls,
        final_page_state: Dict[str, Any],
        verification_rules: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Evaluate final page state against programmatic verification rules.

        Args:
            final_page_state: {
                "url": str,
                "title": str,
                "text_content": str,
                "elements": List[Dict],
                "status_code": int (optional),
                "model_status": str, # e.g. 'done'
            }
            verification_rules: {
                "expected_text": List[str] or str,
                "forbidden_text": List[str] or str,
                "expected_url_pattern": str,
                "min_text_length": int,
                "required_element_labels": List[str],
            }

        Returns:
            (verification_status, summary_message, audit_details)
        """
        if not final_page_state:
            return (
                VerificationStatus.FAILED,
                "Independent verification failed: no final page state was captured.",
                {"reason": "missing_page_state"},
            )

        rules = verification_rules or {}
        audit_details: Dict[str, Any] = {
            "evaluated_rules": [],
            "final_url": final_page_state.get("url", ""),
            "page_title": final_page_state.get("title", ""),
            "model_reported_status": final_page_state.get("model_status", ""),
        }

        # 1. Check for standard error signatures on the final page
        text_content = final_page_state.get("text_content", "") or ""
        error_signatures = [
            "404 Not Found",
            "500 Internal Server Error",
            "502 Bad Gateway",
            "Access Denied",
            "Page Not Found",
            "Service Unavailable",
        ]
        for sig in error_signatures:
            if sig.lower() in text_content.lower():
                msg = f"Independent verification FAILED: Page contains error signature '{sig}'."
                audit_details["failure_point"] = "error_signature_detected"
                audit_details["signature"] = sig
                return VerificationStatus.FAILED, msg, audit_details

        # 2. Expected Text Match
        expected_text = rules.get("expected_text")
        if expected_text:
            if isinstance(expected_text, str):
                expected_text = [expected_text]
            for exp in expected_text:
                if exp.lower() not in text_content.lower():
                    msg = f"Independent verification FAILED: Expected text '{exp}' not found in final page content."
                    audit_details["failure_point"] = "expected_text_missing"
                    audit_details["missing_text"] = exp
                    return VerificationStatus.FAILED, msg, audit_details
                audit_details["evaluated_rules"].append(f"expected_text_matched:{exp}")

        # 3. Forbidden Text Match
        forbidden_text = rules.get("forbidden_text")
        if forbidden_text:
            if isinstance(forbidden_text, str):
                forbidden_text = [forbidden_text]
            for forb in forbidden_text:
                if forb.lower() in text_content.lower():
                    msg = f"Independent verification FAILED: Forbidden text '{forb}' detected on final page."
                    audit_details["failure_point"] = "forbidden_text_present"
                    audit_details["forbidden_text"] = forb
                    return VerificationStatus.FAILED, msg, audit_details
                audit_details["evaluated_rules"].append(f"forbidden_text_absent:{forb}")

        # 4. Expected URL Pattern Match
        url_pattern = rules.get("expected_url_pattern")
        if url_pattern:
            current_url = final_page_state.get("url", "")
            if not re.search(url_pattern, current_url):
                msg = f"Independent verification FAILED: Current URL '{current_url}' did not match expected pattern '{url_pattern}'."
                audit_details["failure_point"] = "url_pattern_mismatch"
                audit_details["expected_pattern"] = url_pattern
                return VerificationStatus.FAILED, msg, audit_details
            audit_details["evaluated_rules"].append(f"url_pattern_matched:{url_pattern}")

        # 5. Minimum Content Length Check
        min_length = rules.get("min_text_length", 20)
        if len(text_content.strip()) < min_length:
            msg = f"Independent verification FAILED: Page content too sparse ({len(text_content)} chars < min {min_length})."
            audit_details["failure_point"] = "insufficient_content_length"
            return VerificationStatus.FAILED, msg, audit_details
        audit_details["evaluated_rules"].append("min_text_length_passed")

        # 6. Required Element Labels (if provided)
        required_labels = rules.get("required_element_labels")
        if required_labels:
            elements = final_page_state.get("elements", [])
            element_texts = [
                str(el.get("text", "") or el.get("aria_label", "") or el.get("label", "")).lower()
                for el in elements
            ]
            for req_label in required_labels:
                if not any(req_label.lower() in el_txt for el_txt in element_texts):
                    msg = f"Independent verification FAILED: Required element '{req_label}' was not found in action space."
                    audit_details["failure_point"] = "required_element_missing"
                    audit_details["missing_element"] = req_label
                    return VerificationStatus.FAILED, msg, audit_details
                audit_details["evaluated_rules"].append(f"required_element_found:{req_label}")

        success_msg = f"Independent verification PASSED: Verified {len(audit_details['evaluated_rules'])} post-condition rules on {final_page_state.get('url')}."
        return VerificationStatus.PASSED, success_msg, audit_details
