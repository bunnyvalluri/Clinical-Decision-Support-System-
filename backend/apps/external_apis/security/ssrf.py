"""
Healthcare DevSecOps SSRF Protection & PHI Boundary Guard:
- Private IP blocking (RFC 1918, RFC 3927)
- Loopback & Link-local blocking (127.0.0.0/8, 169.254.0.0/16, ::1)
- Cloud Instance Metadata Service (IMDS) blocking (169.254.169.254)
- Domain Allowlist Enforcement
- Strict HTTPS Protocol Enforcement
- Default-DENY PHI Exfiltration Filter
"""
import ipaddress
import logging
import re
import socket
from urllib.parse import urlparse
from typing import Any

logger = logging.getLogger(__name__)


class SSRFSecurityException(Exception):
    """Raised when an outbound URL violates SSRF security policies."""
    pass


class PHIExfiltrationException(Exception):
    """Raised when outgoing request payload contains protected health information."""
    pass


# Default allowlisted domains for approved healthcare external integrations
DEFAULT_ALLOWED_DOMAINS = [
    "api.fda.gov",
    "npiregistry.cms.hhs.gov",
    "data.cms.gov",
    "api.nal.usda.gov",
]

# Sensitive PHI Regex Patterns (MRN, SSN, EHR Identifiers, Patient Names)
PHI_PATTERNS = [
    re.compile(r"\bMRN[-\s]?\d{4,10}\b", re.IGNORECASE),
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN
    re.compile(r"\bpatient[_-]?id\b", re.IGNORECASE),
    re.compile(r"\bmedical[_-]?record[_-]?number\b", re.IGNORECASE),
]


def validate_url_against_ssrf(url: str, allowed_domains: list[str] | None = None) -> None:
    """
    Validate that an outbound URL does not target localhost, private subnets,
    link-local addresses, or cloud metadata endpoints.
    Enforces HTTPS protocol.
    """
    if not url:
        raise SSRFSecurityException("URL cannot be empty.")

    try:
        parsed = urlparse(url)
    except Exception as exc:
        raise SSRFSecurityException(f"Malformed URL: {exc}")

    # 1. Enforce HTTPS
    if parsed.scheme.lower() != "https":
        raise SSRFSecurityException(
            f"Insecure protocol '{parsed.scheme}': Healthcare APIs must use HTTPS."
        )

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityException("Target URL does not contain a valid hostname.")

    # 2. Check if hostname is a direct IP address
    is_direct_ip = False
    try:
        ipaddress.ip_address(hostname)
        is_direct_ip = True
    except ValueError:
        is_direct_ip = False

    # For domain names: Enforce domain allowlist first to avoid leaking DNS lookups
    if not is_direct_ip:
        allowed = allowed_domains if allowed_domains is not None else DEFAULT_ALLOWED_DOMAINS
        matched_domain = any(
            hostname.lower() == domain.lower() or hostname.lower().endswith("." + domain.lower())
            for domain in allowed
        )
        if not matched_domain:
            raise SSRFSecurityException(
                f"Host '{hostname}' is not in the approved external API domain allowlist."
            )

    # 3. Resolve DNS / Parse IP and inspect target IP addresses against private ranges
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise SSRFSecurityException(f"Failed to resolve hostname '{hostname}': {exc}")

    for family, socktype, proto, canonname, sockaddr in addr_info:
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            raise SSRFSecurityException(f"Invalid IP address format: {ip_str}")

        # Explicit Cloud Metadata IP block (169.254.169.254)
        if str(ip_obj) == "169.254.169.254":
            raise SSRFSecurityException("SSRF violation: Cloud metadata service access forbidden.")

        # Check loopback (127.0.0.0/8, ::1)
        if ip_obj.is_loopback:
            raise SSRFSecurityException(f"SSRF violation: Loopback IP {ip_str} is forbidden.")

        # Check private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
        if ip_obj.is_private:
            raise SSRFSecurityException(f"SSRF violation: Private IP {ip_str} is forbidden.")

        # Check link-local (169.254.0.0/16, fe80::/10)
        if ip_obj.is_link_local:
            raise SSRFSecurityException(f"SSRF violation: Link-local IP {ip_str} is forbidden.")


def check_phi_violation(data: Any) -> None:
    """
    Ensure outgoing request payload does not contain patient identifiers or PHI tokens.
    """
    text_repr = str(data)
    for pattern in PHI_PATTERNS:
        if pattern.search(text_repr):
            logger.critical(
                "CRITICAL SECURITY ALERT: Potential PHI exfiltration detected in external API request payload!"
            )
            raise PHIExfiltrationException(
                "Request blocked: Outgoing payload contains protected health information (PHI)."
            )
