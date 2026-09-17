"""
Security Policy Engine.
Enforces default-deny rules, environment verification, dual-custody authorization,
scope boundary checks, SSRF / cloud-metadata blocks, and emergency kill-switch status.
"""
import ipaddress
import logging
import re
from urllib.parse import urlparse
from typing import Tuple, Optional, List
from django.conf import settings
from django.utils import timezone
from apps.accounts.models import UserRole
from apps.security_testing.models import SecurityTarget, SecurityScan, SecurityEnvironment, ApprovalStatus

logger = logging.getLogger("security_testing.policy")


class SecurityPolicyEngine:
    """
    Centralized authoritative policy evaluator for DevSecOps and Strix operations.
    """

    BLOCKED_IP_NETWORKS = [
        ipaddress.ip_network("169.254.0.0/16"),   # Link-local & Cloud metadata
        ipaddress.ip_network("127.0.0.0/8"),      # Loopback (unless explicitly authorized local lab)
        ipaddress.ip_network("10.0.0.0/8"),       # Private RFC1918
        ipaddress.ip_network("172.16.0.0/12"),    # Private RFC1918
        ipaddress.ip_network("192.168.0.0/16"),   # Private RFC1918
        ipaddress.ip_network("0.0.0.0/8"),
    ]

    FORBIDDEN_SCOPE_PATTERNS = [
        r"^/production/.*",
        r"^/admin/destructive.*",
        r"^/patient/export/.*",
        r"^/api/v1/auth/token/refresh/.*",
        r"^/metadata/.*",
    ]

    @classmethod
    def is_kill_switch_active(cls) -> bool:
        """Returns True if the global security testing kill-switch is active."""
        return getattr(settings, "SECURITY_KILL_SWITCH", False)

    @classmethod
    def can_scan_environment(cls, environment: str, user) -> Tuple[bool, str]:
        """Validates environmental permissions."""
        if cls.is_kill_switch_active():
            return False, "Scan rejected: Global security kill-switch is currently active."

        if environment == SecurityEnvironment.PRODUCTION:
            prod_enabled = getattr(settings, "SECURITY_PRODUCTION_SCAN_ENABLED", False)
            if not prod_enabled:
                return False, "Scan rejected: Production scanning is strictly disabled by system policy."

            user_role = getattr(user, "role", None)
            if user_role not in [UserRole.IT_ADMIN, UserRole.ADMIN]:
                return False, "Scan rejected: Dual-custody IT Administrator approval required for production testing."

        return True, "Environment permitted."

    @classmethod
    def can_scan_target(cls, target: SecurityTarget, user) -> Tuple[bool, str]:
        """Enforces default-deny target allowlist and active authorization."""
        if not target:
            return False, "Target does not exist."

        if not target.is_active:
            return False, f"Target '{target.name}' is inactive."

        if target.approval_status != ApprovalStatus.APPROVED:
            return False, f"Target '{target.name}' is not authorized (Status: {target.approval_status})."

        if target.approval_expires_at and timezone.now() > target.approval_expires_at:
            return False, f"Target authorization has expired on {target.approval_expires_at}."

        env_ok, env_msg = cls.can_scan_environment(target.environment, user)
        if not env_ok:
            return False, env_msg

        return True, "Target approved for scanning."

    @classmethod
    def validate_target_scope(
        cls,
        target: SecurityTarget,
        requested_path: str,
    ) -> Tuple[bool, str]:
        """
        Validates that a given URI / path is strictly within the allowed target scope
        and does not cross into excluded or forbidden paths.
        """
        norm_path = requested_path.strip()

        # Check explicit forbidden patterns
        for pattern in cls.FORBIDDEN_SCOPE_PATTERNS:
            if re.match(pattern, norm_path, re.IGNORECASE):
                return False, f"Scope violation: Path '{norm_path}' matches forbidden security boundary pattern '{pattern}'."

        # Check target allowed scope
        allowed_scopes = [s.strip() for s in target.scope.split(",") if s.strip()]
        if not allowed_scopes:
            return True, "No specific path scope restrictions on target."

        in_scope = False
        for allowed in allowed_scopes:
            if norm_path.startswith(allowed) or allowed == "*":
                in_scope = True
                break

        if not in_scope:
            return False, f"Path '{norm_path}' is not within authorized target scope ({target.scope})."

        return True, "Scope valid."

    @classmethod
    def can_view_finding(cls, user, finding) -> bool:
        """Enforces 5-role RBAC for finding inspection."""
        if not user or not user.is_authenticated:
            return False

        user_role = getattr(user, "role", None)
        if user_role in [UserRole.IT_ADMIN, UserRole.ADMIN]:
            return True

        if user_role == UserRole.MEDICAL_INFORMATICIST:
            # Informaticists may only review AI, ML, or data-pipeline findings
            vuln_cat = (finding.vulnerability_type or "").upper()
            affected = (finding.affected_component or "").upper()
            return any(k in vuln_cat or k in affected for k in ["AI", "ML", "MODEL", "PIPELINE", "PREDICTION", "SHAP", "INFERENCE"])

        # Patients, Doctors, Nurses strictly denied
        return False

    @classmethod
    def can_retest(cls, user, finding) -> bool:
        """Only IT administrators can trigger vulnerability retest."""
        if not user or not user.is_authenticated:
            return False
        user_role = getattr(user, "role", None)
        return user_role in [UserRole.IT_ADMIN, UserRole.ADMIN]

    @classmethod
    def can_export_report(cls, user, report) -> bool:
        """Reports contain sensitive architecture details; requires IT Admin authorization."""
        if not user or not user.is_authenticated:
            return False
        user_role = getattr(user, "role", None)
        return user_role in [UserRole.IT_ADMIN, UserRole.ADMIN]
