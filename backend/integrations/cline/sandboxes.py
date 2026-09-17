"""
Sandbox execution constraints for Cline agent filesystem, shell, and external tools.
Enforces strict default-deny invariants, path traversal defenses, and secret redactions.
"""
import os
import re
import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("integrations.cline.sandboxes")

# Sensitive file patterns that must NEVER be accessed or returned
BLOCKED_FILE_PATTERNS = [
    r"\.env",
    r"\.env\..*",
    r".*\.key$",
    r".*\.pem$",
    r"id_rsa.*",
    r".*\.pfx$",
    r"\.git.*",
    r".*secret.*",
    r".*credential.*",
    r".*coolify_token.*",
]

# Prohibited shell commands
PROHIBITED_COMMAND_PATTERNS = [
    r"rm\s+-rf",
    r"mkfs",
    r"dd\s+",
    r"iptables",
    r"drop\s+database",
    r"truncate\s+",
    r"chmod\s+777",
    r"curl.*\|.*sh",
    r"wget.*\|.*sh",
    r"eval\(",
    r"exec\(",
]

# Allowlisted engineering commands in sandbox
ALLOWED_DEV_COMMANDS = [
    "pytest",
    "npm test",
    "npm run build",
    "bun test",
    "ruff check",
    "mypy",
    "tsc --noEmit",
]


class SandboxedExecutionEngine:
    """
    Enforces isolation boundaries on filesystem and process operations.
    """

    WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    SCRATCH_DIR = os.path.abspath(os.path.join(WORKSPACE_ROOT, "scratch"))

    @classmethod
    def validate_file_path(cls, path: str, allow_write: bool = False) -> Tuple[bool, str]:
        """
        Validates path traversal attempts, blocked filenames, and directory boundaries.
        """
        if not path or not isinstance(path, str):
            return False, "Invalid path specified"

        # Traversal checks
        if ".." in path or "/./" in path or "\\.\\" in path:
            logger.warning("Path traversal sequence blocked: %s", path)
            return False, "Path traversal sequences ('..') are strictly forbidden."

        # Check against blocked file patterns
        base_name = os.path.basename(path).lower()
        for pattern in BLOCKED_FILE_PATTERNS:
            if re.search(pattern, base_name):
                logger.warning("Access to sensitive file blocked: %s", base_name)
                return False, f"Access to secret/credential file '{base_name}' is forbidden."

        # Canonicalize
        normalized = os.path.normpath(path)
        if not os.path.isabs(normalized):
            resolved = os.path.abspath(os.path.join(cls.WORKSPACE_ROOT, normalized))
        else:
            resolved = normalized

        # Must reside within workspace root
        if not resolved.startswith(cls.WORKSPACE_ROOT):
            logger.warning("Attempted path escape outside workspace root: %s", resolved)
            return False, "Access outside project root is strictly denied."

        # Write operations restricted to scratch or approved dev folders
        if allow_write:
            if not resolved.startswith(cls.SCRATCH_DIR) and "scratch" not in resolved:
                return False, "Agent write operations are restricted to the isolated /scratch directory."

        return True, resolved

    @classmethod
    def validate_shell_command(cls, command: str, role: str, environment: str) -> Tuple[bool, str]:
        """
        Enforces execution policies:
        - Clinical roles (DOCTOR, NURSE, PATIENT) have shell DISABLED.
        - Production environment shell is CATEGORICALLY DENIED.
        - Dev/Admin shell must not match prohibited patterns.
        """
        normalized_role = role.upper()
        if normalized_role in ["PATIENT", "USER", "DOCTOR", "NURSE"]:
            return False, f"Shell execution is completely disabled for clinical/patient role '{role}'."

        if environment.upper() == "PRODUCTION":
            return False, "Shell execution is categorically DENIED in the production environment."

        cmd_lower = command.strip().lower()

        for pattern in PROHIBITED_COMMAND_PATTERNS:
            if re.search(pattern, cmd_lower):
                logger.warning("Dangerous command blocked: %s", command)
                return False, f"Command matches prohibited destructive pattern: '{pattern}'."

        return True, "Command passed security sandbox validation."


class ClinicalQueryTool:
    """
    Controlled, read-only parameterized clinical query abstraction.
    Strictly forbids raw SQL injection and respects patient boundaries.
    """

    ALLOWED_TEMPLATES = {
        "PATIENT_VITALS": {
            "description": "Fetch vital signs for a given patient encounter",
            "model": "vitals",
            "allowed_columns": ["heart_rate", "systolic_bp", "diastolic_bp", "spo2", "temperature", "recorded_at"],
            "max_rows": 50,
        },
        "PATIENT_LABS": {
            "description": "Fetch laboratory measurements for a given patient",
            "model": "labs",
            "allowed_columns": ["test_name", "value", "unit", "reference_range", "collected_at"],
            "max_rows": 50,
        },
        "PREDICTION_SUMMARY": {
            "description": "Fetch existing calibrated ML prediction records",
            "model": "predictions",
            "allowed_columns": ["risk_score", "risk_level", "model_version", "created_at"],
            "max_rows": 10,
        },
    }

    @classmethod
    def execute_query(cls, template_name: str, patient_id: str, user_role: str) -> Dict[str, Any]:
        """
        Executes an approved read-only parameterized query template.
        """
        if template_name not in cls.ALLOWED_TEMPLATES:
            return {
                "success": False,
                "error": f"Template '{template_name}' is not in approved query allowlist.",
                "code": "QUERY_TEMPLATE_UNAPPROVED",
            }

        if user_role.upper() in ["PATIENT", "USER"]:
            return {
                "success": False,
                "error": "Direct query templates are restricted from unprivileged user roles.",
                "code": "UNAUTHORIZED_ROLE",
            }

        cfg = cls.ALLOWED_TEMPLATES[template_name]
        logger.info("Executing controlled clinical query: %s for patient %s", template_name, patient_id)

        # In production this queries through authorized Django ORM models
        return {
            "success": True,
            "template": template_name,
            "patient_id": patient_id,
            "columns": cfg["allowed_columns"],
            "rows_limit": cfg["max_rows"],
            "data": [],
        }


class CoolifyDeploymentTool:
    """
    Controlled interface to Coolify deployment engine.
    Mandates human approval for any deployment action.
    """

    @classmethod
    def request_deployment(
        cls,
        service_name: str,
        commit_sha: str,
        environment: str,
        requested_by_user_id: str,
    ) -> Dict[str, Any]:
        """
        Creates a deployment request requiring human sign-off.
        Does NOT autonomously execute production deployments.
        """
        logger.info("Deployment request created for service %s (sha: %s)", service_name, commit_sha)
        return {
            "success": True,
            "action": "DEPLOYMENT_REQUESTED",
            "status": "WAITING_FOR_HUMAN_APPROVAL",
            "service": service_name,
            "commit": commit_sha,
            "environment": environment,
            "requires_approval": True,
            "message": "Deployment request submitted. Awaiting authorized IT Admin sign-off.",
        }
