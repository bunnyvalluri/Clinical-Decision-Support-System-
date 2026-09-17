"""
Security controls for NocoDB Integration:
- SSRF prevention
- Spreadsheet Formula Injection sanitization
- Webhook HMAC SHA-256 verification
- PHI Redaction / Tokenization
"""
import hashlib
import hmac
import ipaddress
import socket
import urllib.parse
from django.conf import settings
from rest_framework.exceptions import ValidationError


BLOCKED_HOSTNAMES = {
    "localhost",
    "127.0.0.1",
    "::1",
    "169.254.169.254",
    "metadata.google.internal",
    "instance-data",
}

DEFAULT_ALLOWED_INTERNAL_HOSTS = {
    "nocodb",
    "localhost",
    "127.0.0.1",
}


def is_ssrf_safe_url(url: str, allow_internal_nocodb: bool = True) -> bool:
    """
    Validates URL to block Server-Side Request Forgery (SSRF) against cloud metadata,
    loopback, and internal private network ranges.
    """
    if not url:
        return False
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in ["http", "https"]:
        return False

    hostname = parsed.hostname
    if not hostname:
        return False

    hostname_lower = hostname.lower()

    # If internal NocoDB container is explicitly allowed (e.g. docker host 'nocodb')
    if allow_internal_nocodb and hostname_lower in ["nocodb"]:
        return True

    if hostname_lower in BLOCKED_HOSTNAMES:
        return False

    # Resolve IP address to check for private / link-local subnets
    try:
        ip_str = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(ip_str)

        if ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return False

        # In production, block private RFC 1918 subnets unless allowlisted
        allowed_subnets = getattr(settings, "NOCODB_ALLOWED_PRIVATE_SUBNETS", [])
        if ip.is_private:
            is_allowlisted = any(
                ip in ipaddress.ip_network(subnet) for subnet in allowed_subnets
            )
            if not is_allowlisted:
                return False

    except Exception:
        # If hostname cannot be resolved, reject for safety
        return False

    return True


def sanitize_cell_value(val):
    """
    Prevents Spreadsheet Formula Injection (CSV / Excel Injection).
    Escapes characters (=, +, -, @, tab, CR) if present at start of string.
    """
    if val is None:
        return ""
    if isinstance(val, (int, float, bool)):
        return val
    s = str(val)
    if s.startswith(("\t", "\r", "=", "+", "-", "@")) or s.strip().startswith(("=", "+", "-", "@")):
        return "'" + s
    return s



def verify_webhook_hmac(payload_bytes: bytes, signature: str, secret: str) -> bool:
    """
    Validates HMAC SHA-256 webhook signature.
    """
    if not signature or not secret:
        return False
    expected = hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected.lower(), signature.lower())


def redact_phi_fields(data: dict, is_admin: bool = False) -> dict:
    """
    Masks and removes potential PHI fields from dictionary records before returning to client.
    """
    if not isinstance(data, dict):
        return data
    cleaned = {}
    for k, v in data.items():
        k_lower = k.lower()
        if not is_admin and (
            "patient_name" in k_lower
            or "ssn" in k_lower
            or "mrn" in k_lower
            or "dob" in k_lower
            or "address" in k_lower
            or "phone" in k_lower
        ):
            cleaned[k] = "[REDACTED_PHI]"
        else:
            cleaned[k] = v
    return cleaned
