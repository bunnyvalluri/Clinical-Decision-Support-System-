"""
Security scanners for Clinical Whiteboards:
1. Secret & Credential Scanning (API keys, JWTs, AWS credentials, DB connection strings)
2. SVG Sanitization (blocking script injections, malicious handlers)
3. PHI Detection for de-identified or internal boards
"""
import re
from rest_framework.exceptions import ValidationError

# Secret detection patterns
SECRET_PATTERNS = [
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*"), "Bearer Token"),
    (re.compile(r"eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"), "JWT Token"),
    (re.compile(r"(?i)(?:postgres|postgresql|mysql|mongodb|redis)://[a-zA-Z0-9_\-\.]+:[^@\s]+@[a-zA-Z0-9_\-\.]+"), "Database Connection URI with Password"),
    (re.compile(r"(?i)AKIA[0-9A-Z]{16}"), "AWS Access Key ID"),
    (re.compile(r"(?i)ghp_[a-zA-Z0-9]{36}"), "GitHub Personal Access Token"),
    (re.compile(r"(?i)sk-[a-zA-Z0-9]{32,}"), "OpenAI / AI Gateway API Key"),
    (re.compile(r"(?i)(?:password|secret|passwd|api_key)\s*[:=]\s*['\"][^\s'\"]{6,}['\"]"), "Hardcoded Secret / Password Assignment"),
]

# Simple PHI heuristics
PHI_PATTERNS = [
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "Social Security Number (SSN)"),
    (re.compile(r"\bMRN[:\s#]*\d{6,10}\b", re.IGNORECASE), "Medical Record Number (MRN)"),
]

# SVG tags / attributes forbidden
FORBIDDEN_SVG_TAGS = re.compile(r"(?i)<\s*(?:script|iframe|object|embed|applet|meta|link)", re.IGNORECASE)
FORBIDDEN_SVG_ATTRS = re.compile(r"(?i)(?:on[a-z]+|javascript:|data:text/html)", re.IGNORECASE)


def scan_for_secrets(elements):
    """
    Scans Excalidraw text and custom data for sensitive credentials.
    Raises ValidationError if secrets are detected.
    """
    for el in elements:
        text_to_check = []
        if el.get("type") == "text":
            text_to_check.append(el.get("text", ""))
        
        custom_data = el.get("customData")
        if isinstance(custom_data, dict):
            text_to_check.append(str(custom_data))

        combined_text = " \n ".join(text_to_check)
        for pattern, secret_type in SECRET_PATTERNS:
            if pattern.search(combined_text):
                raise ValidationError(
                    f"Security Pre-Save Violation: Detected sensitive credential ({secret_type}). "
                    "Secrets and credentials must NEVER be placed on clinical whiteboards."
                )


def scan_for_unauthorized_phi(elements, classification: str):
    """
    Scans for obvious PHI tokens (e.g. SSN or MRN) if board is marked as PUBLIC or INTERNAL.
    """
    if classification in ["PHI", "RESTRICTED"]:
        return  # Permitted on designated PHI boards subject to clinical RBAC

    for el in elements:
        if el.get("type") == "text":
            text = el.get("text", "")
            for pattern, phi_type in PHI_PATTERNS:
                if pattern.search(text):
                    raise ValidationError(
                        f"HIPAA Pre-Save Violation: Detected {phi_type} on a board classified as '{classification}'. "
                        "Reclassify board to 'PHI' or remove identifying details."
                    )


def sanitize_svg_content(svg_string: str) -> str:
    """
    Sanitizes SVG content, stripping scripts, interactive event handlers, and data URIs.
    """
    if not svg_string:
        return ""
    if FORBIDDEN_SVG_TAGS.search(svg_string):
        raise ValidationError("Uploaded SVG contains forbidden script or executable tags.")
    if FORBIDDEN_SVG_ATTRS.search(svg_string):
        raise ValidationError("Uploaded SVG contains forbidden event handlers or javascript: URIs.")
    return svg_string
