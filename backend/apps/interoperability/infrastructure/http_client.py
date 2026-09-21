"""
SSRF-Protected FHIR HTTP Client — BPY-CSE-2666.
Enforces IP boundary checks, prevents SSRF attacks, and handles authenticated communication
with external compatible healthcare systems.
"""
import ipaddress
import socket
from typing import Any, Dict, Optional
import urllib.parse
import urllib.request
import urllib.error
import json

from apps.interoperability.domain.exceptions import FHIRSecurityError


class FHIRHTTPClient:
    """
    Secure HTTP client for external FHIR server interactions.
    Enforces SSRF prevention, strict timeouts, and authentication header injection.
    """

    BLOCKED_NETWORKS = [
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("169.254.0.0/16"),
        ipaddress.ip_network("::1/128"),
        ipaddress.ip_network("fc00::/7"),
        ipaddress.ip_network("fe80::/10"),
    ]

    @classmethod
    def validate_url(cls, url: str) -> None:
        """Validate URL to ensure it does not target private or local infrastructure (SSRF Guard)."""
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise FHIRSecurityError(f"Invalid URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted.")

        hostname = parsed.hostname
        if not hostname:
            raise FHIRSecurityError("URL must contain a valid hostname.")

        # Check for localhost / loopback aliases
        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
            raise FHIRSecurityError(f"Target '{hostname}' violates SSRF protection policy.")

        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                for blocked_net in cls.BLOCKED_NETWORKS:
                    if ip_obj in blocked_net:
                        raise FHIRSecurityError(
                            f"Target resolved to private IP {ip_str}, which violates SSRF egress policy."
                        )
        except socket.gaierror:
            pass  # Let request fail normally if DNS cannot resolve

    @classmethod
    def get(cls, url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 15) -> Dict[str, Any]:
        """Execute secure GET request to external FHIR endpoint."""
        cls.validate_url(url)
        req_headers = {"Accept": "application/fhir+json, application/json"}
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, headers=req_headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read().decode("utf-8")
                return json.loads(data)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise FHIRSecurityError(f"External FHIR GET failed ({e.code}): {err_body[:200]}")
        except Exception as e:
            raise FHIRSecurityError(f"External FHIR GET connection failed: {str(e)}")

    @classmethod
    def post(cls, url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None, timeout: int = 15) -> Dict[str, Any]:
        """Execute secure POST request to external FHIR endpoint."""
        cls.validate_url(url)
        body_bytes = json.dumps(payload).encode("utf-8")
        req_headers = {
            "Content-Type": "application/fhir+json; charset=UTF-8",
            "Accept": "application/fhir+json, application/json",
        }
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read().decode("utf-8")
                return json.loads(data) if data else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise FHIRSecurityError(f"External FHIR POST failed ({e.code}): {err_body[:200]}")
        except Exception as e:
            raise FHIRSecurityError(f"External FHIR POST connection failed: {str(e)}")
