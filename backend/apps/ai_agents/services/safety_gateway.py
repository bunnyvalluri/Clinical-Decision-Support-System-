"""
Browser Agent Safety Gateway for HealthNova AI.

Enforces zero-trust boundary controls:
1. Operational Kill Switch check
2. SSRF Protection (DNS resolution + private/cloud metadata IP blocking)
3. Approved Destination Allowlist enforcement (Neon PostgreSQL backed)
4. Default-deny PHI boundary enforcement
5. Adversarial prompt injection defense
6. Risk classification and approval requirement assignment
"""
import ipaddress
import logging
import os
import re
import socket
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from apps.ai_agents.models import (
    AgentKillSwitchState,
    ApprovedDestination,
    BrowserAgentTask,
    BrowserTaskState,
    DataClassification,
    ToolRiskLevel,
)
from apps.core.models import AuditLog

logger = logging.getLogger("ai_agents.safety_gateway")

# SSRF Forbidden Networks
BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # RFC 1918 Private
    ipaddress.ip_network("172.16.0.0/12"),     # RFC 1918 Private
    ipaddress.ip_network("192.168.0.0/16"),    # RFC 1918 Private
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local / Cloud Metadata (169.254.169.254)
    ipaddress.ip_network("0.0.0.0/8"),         # Broadcast
    ipaddress.ip_network("::1/128"),           # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 Unique Local
    ipaddress.ip_network("fe80::/10"),         # IPv6 Link-Local
]

# Prompt injection & adversarial goal indicators
ADVERSARIAL_PATTERNS = [
    r"(?i)ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions",
    r"(?i)system\s*prompt\s*override",
    r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
    r"(?i)jailbreak",
    r"(?i)bypass\s+safety",
    r"(?i)disregard\s+(?:all\s+)?rules",
    r"(?i)dump\s+(?:the\s+)?(?:database|records|credentials|passwords|env)",
    r"(?i)drop\s+table",
    r"(?i)select\s+\*\s+from",
    r"(?i)cat\s+/etc/passwd",
    r"(?i)curl\s+http",
    r"(?i)download\s+(?:malware|executable|\.exe|\.sh|\.bat)",
    r"(?i)prescribe\s+",
    r"(?i)diagnose\s+",
    r"(?i)override\s+(?:clinical|doctor|physician)",
]

# PHI Pattern Heuristics
PHI_PATTERNS = [
    r"\b\d{3}-\d{2}-\d{4}\b",                 # SSN
    r"(?i)\bmrn[:\s#]*[A-Z0-9-]{6,15}\b",     # MRN
    r"(?i)\bpatient\s+(?:name|record|id)\b",   # Patient record markers
    r"(?i)\bdiagnosis[:\s]+[A-Z0-9\.\s]{4,30}",# Clinical diagnosis marker
]


class BrowserAgentSafetyGateway:
    """
    Authoritative safety gateway for controlled browser agent workflows.
    """

    @classmethod
    def is_kill_switch_active(cls) -> Tuple[bool, str]:
        """
        Check if emergency kill switch is activated in DB or environment.
        """
        env_disabled = os.getenv("BROWSER_AGENT_GLOBAL_ENABLED", "true").lower() in ["false", "0", "no"]
        if env_disabled:
            return True, "Emergency kill switch active via environment configuration."

        try:
            db_switch = AgentKillSwitchState.objects.filter(is_active=True).first()
            if db_switch:
                return True, f"Emergency kill switch activated: {db_switch.reason or 'Administrative override'}."
        except Exception as exc:
            logger.warning("Could not query AgentKillSwitchState: %s", exc)

        return False, ""

    @classmethod
    def validate_url_and_ssrf(cls, raw_url: str) -> Tuple[bool, str, str]:
        """
        Validate URL scheme and resolve DNS to prevent SSRF against private networks.
        Returns: (is_safe, domain, error_reason)
        """
        if not raw_url or not isinstance(raw_url, str):
            return False, "", "Destination URL is required."

        parsed = urlparse(raw_url.strip())
        if parsed.scheme not in ("http", "https"):
            return False, "", f"Disallowed protocol '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

        hostname = parsed.hostname
        if not hostname:
            return False, "", "Invalid URL: missing destination hostname."

        # Block localhost / direct IP format attempts
        if hostname.lower() in ("localhost", "127.0.0.1", "::1"):
            return False, hostname, "SSRF Blocked: Localhost access is strictly prohibited."

        # Resolve DNS and check all resolved IPs
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                for network in BLOCKED_IP_NETWORKS:
                    if ip_obj in network:
                        return False, hostname, f"SSRF Blocked: Host '{hostname}' resolves to private/internal IP {ip_str}."
        except socket.gaierror:
            return False, hostname, f"DNS resolution failed for host '{hostname}'."
        except Exception as exc:
            return False, hostname, f"Error validating destination network address: {exc}"

        return True, hostname.lower(), ""

    @classmethod
    def check_destination_allowlist(cls, domain: str) -> Tuple[bool, Optional[ApprovedDestination], str]:
        """
        Validate domain against ApprovedDestination allowlist.
        Default: DENY. Unknown domains: BLOCKED.
        """
        try:
            # Check exact match or parent domain
            dest = ApprovedDestination.objects.filter(is_active=True).filter(domain__iexact=domain).first()
            if not dest:
                # Check wildcard/parent domain match
                parts = domain.split(".")
                if len(parts) > 2:
                    parent_domain = ".".join(parts[1:])
                    dest = ApprovedDestination.objects.filter(is_active=True).filter(domain__iexact=parent_domain).first()

            if not dest:
                return False, None, f"Domain '{domain}' is not in the approved destinations allowlist. Action BLOCKED."

            return True, dest, ""
        except Exception as exc:
            logger.error("Destination allowlist query error: %s", exc)
            return False, None, f"Destination allowlist verification error: {exc}"

    @classmethod
    def scan_goal_safety(cls, goal: str) -> Tuple[bool, str]:
        """
        Scan natural-language goal for prompt injection or unauthorized clinical directives.
        """
        if not goal or not goal.strip():
            return False, "Goal cannot be empty."

        for pattern in ADVERSARIAL_PATTERNS:
            if re.search(pattern, goal):
                return False, f"Prompt injection or safety violation detected matching pattern: '{pattern}'."

        return True, ""

    @classmethod
    def scan_phi_boundary(cls, goal: str, dest: Optional[ApprovedDestination]) -> Tuple[bool, str]:
        """
        Enforce PHI boundary. Default DENY.
        """
        for pattern in PHI_PATTERNS:
            if re.search(pattern, goal):
                if not dest or not dest.phi_allowed:
                    return False, "Goal contains potential PHI (Protected Health Information). Destination forbids PHI access."

        return True, ""

    @classmethod
    def classify_risk_level(cls, goal: str, dest: Optional[ApprovedDestination]) -> str:
        """
        Determine risk classification: LOW, MEDIUM, HIGH, CRITICAL.
        """
        goal_lower = goal.lower()
        # High/Critical triggers: form submit, delete, order, change, upload, click buttons that mutate state
        mutation_keywords = ["submit", "delete", "post", "send", "upload", "purchase", "order", "update", "modify"]
        if any(kw in goal_lower for kw in mutation_keywords):
            return ToolRiskLevel.HIGH

        if dest and dest.authentication_required:
            return ToolRiskLevel.MEDIUM

        return ToolRiskLevel.LOW

    @classmethod
    def evaluate_task_submission(
        cls,
        user: Any,
        goal: str,
        destination_url: str,
        requested_phi: str = DataClassification.PUBLIC,
    ) -> Dict[str, Any]:
        """
        Perform complete validation pass for a requested browser task.
        """
        # 1. Kill Switch
        kill_active, kill_reason = cls.is_kill_switch_active()
        if kill_active:
            return {
                "is_approved_to_run": False,
                "execution_status": BrowserTaskState.BLOCKED,
                "block_reason": f"AGENT_DISABLED: {kill_reason}",
                "domain": "",
                "risk_level": ToolRiskLevel.CRITICAL,
                "phi_classification": requested_phi,
                "destination": None,
            }

        # 2. SSRF & URL
        url_safe, domain, url_error = cls.validate_url_and_ssrf(destination_url)
        if not url_safe:
            return {
                "is_approved_to_run": False,
                "execution_status": BrowserTaskState.BLOCKED,
                "block_reason": url_error,
                "domain": domain,
                "risk_level": ToolRiskLevel.HIGH,
                "phi_classification": requested_phi,
                "destination": None,
            }

        # 3. Allowlist
        dest_ok, dest_record, dest_error = cls.check_destination_allowlist(domain)
        if not dest_ok:
            return {
                "is_approved_to_run": False,
                "execution_status": BrowserTaskState.BLOCKED,
                "block_reason": dest_error,
                "domain": domain,
                "risk_level": ToolRiskLevel.HIGH,
                "phi_classification": requested_phi,
                "destination": None,
            }

        # 4. Prompt Injection
        goal_safe, goal_error = cls.scan_goal_safety(goal)
        if not goal_safe:
            return {
                "is_approved_to_run": False,
                "execution_status": BrowserTaskState.BLOCKED,
                "block_reason": goal_error,
                "domain": domain,
                "risk_level": ToolRiskLevel.CRITICAL,
                "phi_classification": requested_phi,
                "destination": dest_record,
            }

        # 5. PHI Boundary
        phi_safe, phi_error = cls.scan_phi_boundary(goal, dest_record)
        if not phi_safe or (requested_phi == DataClassification.PHI and not dest_record.phi_allowed):
            return {
                "is_approved_to_run": False,
                "execution_status": BrowserTaskState.BLOCKED,
                "block_reason": phi_error or "PHI is not permitted on this destination domain.",
                "domain": domain,
                "risk_level": ToolRiskLevel.HIGH,
                "phi_classification": requested_phi,
                "destination": dest_record,
            }

        # 6. Risk Level & Approval Requirement
        risk_level = cls.classify_risk_level(goal, dest_record)
        if risk_level in (ToolRiskLevel.HIGH, ToolRiskLevel.CRITICAL):
            # Requires human sign-off
            return {
                "is_approved_to_run": False,
                "execution_status": BrowserTaskState.AWAITING_APPROVAL,
                "block_reason": "High-risk browser action requires human clinician/administrator sign-off.",
                "domain": domain,
                "risk_level": risk_level,
                "phi_classification": requested_phi,
                "destination": dest_record,
            }

        # Approved to proceed
        return {
            "is_approved_to_run": True,
            "execution_status": BrowserTaskState.PENDING,
            "block_reason": "",
            "domain": domain,
            "risk_level": risk_level,
            "phi_classification": requested_phi,
            "destination": dest_record,
        }
