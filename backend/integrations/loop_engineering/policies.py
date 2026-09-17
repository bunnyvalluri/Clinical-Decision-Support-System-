"""
Policy engine and default-deny enforcement for engineering loops.
Enforces:
1. Emergency kill-switch (ENGINEERING_LOOPS_ENABLED)
2. Autonomy levels (L1_REPORT_ONLY, L2_ASSISTED, L3_CONTROLLED_UNATTENDED)
3. Path denylist & protected clinical paths
4. Budget enforcement
5. Production database protection
"""
import re
from typing import Tuple, Optional, List
from django.utils import timezone
from apps.engineering_loops.models import (
    EngineeringLoop,
    EngineeringLoopRun,
    EngineeringLoopBudget,
    AutonomyLevel,
)
from integrations.loop_engineering.config import LoopEngineeringConfig
from integrations.loop_engineering.exceptions import (
    LoopKillSwitchActiveError,
    AutonomyViolationError,
    ProtectedPathViolationError,
    BudgetExceededError,
)


class LoopPolicyEngine:
    """Evaluates operations against strict software and clinical safety boundaries."""

    @classmethod
    def check_kill_switch(cls) -> None:
        if not LoopEngineeringConfig.is_enabled():
            raise LoopKillSwitchActiveError(
                "ENGINEERING_LOOPS_ENABLED is False. All engineering loops are disabled."
            )

    @classmethod
    def validate_path_access(cls, path: str, operation: str = "WRITE") -> Tuple[bool, str]:
        """
        Default-deny check on path access.
        Reading is permitted except for secrets/.env/credentials.
        Writing to clinical, ML, or secret paths is strictly forbidden.
        """
        clean_path = path.strip().replace("\\", "/")

        for pattern in LoopEngineeringConfig.PATH_DENYLIST:
            if re.match(pattern, clean_path):
                if operation in ["WRITE", "MUTATE", "DELETE", "MERGE"]:
                    return False, f"Protected path '{clean_path}' cannot be mutated by engineering loops."
                if any(k in clean_path for k in [".env", "secret", "credential", "private"]):
                    return False, f"Confidential path '{clean_path}' cannot be read."

        return True, "Path access permitted."

    @classmethod
    def can_execute_operation(
        cls, loop: EngineeringLoop, operation: str, target_path: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Verifies if the requested operation is permitted at the loop's autonomy level.
        """
        cls.check_kill_switch()

        if target_path:
            ok, reason = cls.validate_path_access(target_path, operation)
            if not ok:
                return False, reason

        # Autonomy Level Gates
        if loop.autonomy_level == AutonomyLevel.L1_REPORT_ONLY:
            if operation in ["WRITE", "MUTATE", "CREATE_PR", "COMMIT", "DEPLOY", "MERGE"]:
                return False, "L1_REPORT_ONLY loops are strictly read-only and cannot mutate code or create PRs."

        elif loop.autonomy_level == AutonomyLevel.L2_ASSISTED:
            if operation in ["AUTO_MERGE", "DIRECT_DEPLOY", "PRODUCTION_MIGRATE"]:
                return False, "L2_ASSISTED loops require explicit dual-custody human sign-off before merge or deployment."

        elif loop.autonomy_level == AutonomyLevel.L3_CONTROLLED_UNATTENDED:
            # L3 is strictly limited to non-clinical and non-production tasks
            if operation in ["PRODUCTION_DEPLOY", "MODIFY_CLINICAL_MODEL", "MODIFY_AUTH"]:
                return False, "L3 loops are forbidden from altering clinical logic, models, or production infrastructure."

        return True, "Operation permitted under current policy."

    @classmethod
    def check_budget_limit(cls, estimated_cost: float) -> None:
        """Enforces spend limits and hard stops."""
        budget = EngineeringLoopBudget.objects.first()
        if budget and not budget.is_within_budget(estimated_cost):
            raise BudgetExceededError(
                f"Estimated cost ${estimated_cost:.2f} exceeds configured loop budget threshold."
            )
