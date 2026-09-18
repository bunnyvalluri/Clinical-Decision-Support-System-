"""
Policy engine governing Jules automated engineering actions.
Enforces strict security boundaries, branch protection, and dual-custody approval gates.
"""
from enum import Enum
from typing import List, Optional
from integrations.jules.config import get_jules_settings
from integrations.jules.exceptions import JulesPolicyViolationError


class PolicyDecision(str, Enum):
    ALLOW = "ALLOW"
    ALLOW_WITH_APPROVAL = "ALLOW_WITH_APPROVAL"
    DENY = "DENY"


class JulesPolicyEngine:
    # Categories that strictly require human plan approval
    SENSITIVE_CATEGORIES = {
        "SECURITY_FINDING",
        "DATABASE_ERROR",
        "DJANGO_ERROR",
        "API_ERROR",
        "DEPENDENCY_FAILURE",
        "DEPLOYMENT_FAILURE",
    }

    # Protected production branches that Jules cannot directly modify
    PROTECTED_BRANCHES = {"main", "production", "release", "master"}

    @classmethod
    def evaluate(
        cls,
        repository: str,
        branch: str,
        issue_category: str,
        severity: str,
        user_role: str,
        affected_files: Optional[List[str]] = None,
    ) -> PolicyDecision:
        """
        Evaluates an intended Jules remediation against safety rules.
        """
        settings = get_jules_settings()

        # 1. Role Authorization Check: Only IT_ADMIN or ADMIN can trigger engineering automation
        # (MEDICAL_INFORMATICIST allowed only for documentation/ML analysis)
        if user_role not in ("IT_ADMIN", "ADMIN"):
            if user_role == "MEDICAL_INFORMATICIST" and issue_category in ("DOCUMENTATION_FAILURE", "TEST_FAILURE"):
                pass  # Permitted under supervision
            else:
                return PolicyDecision.DENY

        # 2. Repository Allowlist Check
        allowed_repos = settings.allowed_repositories
        if allowed_repos and not any(r.lower() in repository.lower() for r in allowed_repos):
            return PolicyDecision.DENY

        # 3. Branch Protection: Direct modifications to main/production are forbidden
        branch_lower = branch.strip().lower()
        if branch_lower in cls.PROTECTED_BRANCHES or branch_lower.startswith("release/"):
            return PolicyDecision.DENY

        # 4. Sensitive File Inspections (auth, migrations, clinical rules)
        if affected_files:
            for f in affected_files:
                fl = f.lower()
                if any(kw in fl for kw in ("migration", "auth", "permission", "clinical", "prediction", "secret", "settings")):
                    return PolicyDecision.ALLOW_WITH_APPROVAL

        # 5. Global Plan Approval Setting
        if settings.require_plan_approval:
            return PolicyDecision.ALLOW_WITH_APPROVAL

        # 6. Severity & Category based decision
        if severity in ("HIGH", "CRITICAL") or issue_category in cls.SENSITIVE_CATEGORIES:
            return PolicyDecision.ALLOW_WITH_APPROVAL

        # 7. Low-risk categories (typo, documentation, isolated tests) can proceed in development
        if issue_category in ("DOCUMENTATION_FAILURE", "LINT_FAILURE", "TYPESCRIPT_ERROR", "UI_ERROR"):
            return PolicyDecision.ALLOW

        return PolicyDecision.ALLOW_WITH_APPROVAL

    @classmethod
    def enforce_or_raise(
        cls,
        repository: str,
        branch: str,
        issue_category: str,
        severity: str,
        user_role: str,
        affected_files: Optional[List[str]] = None,
    ) -> PolicyDecision:
        """Evaluates policy and raises JulesPolicyViolationError if DENY."""
        decision = cls.evaluate(repository, branch, issue_category, severity, user_role, affected_files)
        if decision == PolicyDecision.DENY:
            raise JulesPolicyViolationError(
                f"Remediation on repo '{repository}' branch '{branch}' for category '{issue_category}' is DENIED by policy."
            )
        return decision
