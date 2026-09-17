"""
Policy Adapter for Cline Agent Execution.
Enforces Role-Based Access Control (RBAC), environment tiers, and action levels (0-5).
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("integrations.cline.policy")


class ClinePolicyAdapter:
    """
    Evaluates role permissions and tool risks under default-deny invariants.
    """

    # Role action level mapping:
    # LEVEL_0: Read-only informational
    # LEVEL_1: Analysis & aggregation
    # LEVEL_2: Draft preparation
    # LEVEL_3: Human-approved action
    # LEVEL_4: Restricted admin action
    # LEVEL_5: Forbidden autonomous clinical action
    ROLE_MAX_LEVELS = {
        "PATIENT": "LEVEL_0",
        "USER": "LEVEL_0",
        "NURSE": "LEVEL_1",
        "DOCTOR": "LEVEL_2",
        "INFORMATICIST": "LEVEL_3",
        "ADMIN": "LEVEL_4",
    }

    ACTION_HIERARCHY = {
        "LEVEL_0": 0,
        "LEVEL_1": 1,
        "LEVEL_2": 2,
        "LEVEL_3": 3,
        "LEVEL_4": 4,
        "LEVEL_5": 5,
    }

    @classmethod
    def can_access_agent_type(cls, user_role: str, agent_type: str) -> Tuple[bool, str]:
        """
        Determines if a role is authorized to instantiate a specialist agent profile.
        """
        role = user_role.upper()
        
        # Clinical roles
        if role in ["PATIENT", "USER"]:
            if agent_type not in ["CLINICAL_KNOWLEDGE_ASSISTANT", "PATIENT_NAVIGATOR"]:
                return False, f"Role '{user_role}' is restricted to informational assistants only."
        elif role == "NURSE":
            if agent_type in ["CODE_REVIEWER", "DOCUMENTATION_AGENT", "INFRASTRUCTURE_ASSISTANT"]:
                return False, f"Role '{user_role}' is not authorized to invoke engineering agents."
        elif role == "DOCTOR":
            if agent_type in ["INFRASTRUCTURE_ASSISTANT", "CODE_REVIEWER"]:
                return False, f"Physicians cannot invoke infrastructure agents."

        return True, "Authorized"

    @classmethod
    def evaluate_tool_permission(
        cls,
        tool_name: str,
        user_role: str,
        environment: str,
        risk_level: str = "LOW",
    ) -> Tuple[bool, bool, str]:
        """
        Evaluates whether a tool call is permitted.
        Returns: (is_permitted, requires_human_approval, reason)
        """
        role = user_role.upper()
        env = environment.upper()

        # Prohibited operations
        if tool_name in ["run_production_shell", "execute_arbitrary_sql", "delete_production_database"]:
            logger.critical("Forbidden operation requested: %s by %s", tool_name, user_role)
            return False, False, f"Operation '{tool_name}' is unconditionally FORBIDDEN."

        # High / Critical risk requires human approval
        if risk_level in ["HIGH", "CRITICAL"]:
            if role != "ADMIN" and role != "INFORMATICIST":
                return False, False, f"High-risk tools require administrative role privileges."
            return True, True, f"Tool '{tool_name}' carries {risk_level} risk and requires human approval."

        # Medium risk in production requires human approval
        if risk_level == "MEDIUM" and env == "PRODUCTION":
            return True, True, "Medium-risk operations in production require human approval."

        # Default low risk is allowed
        return True, False, "Tool execution permitted under standard sandbox."
