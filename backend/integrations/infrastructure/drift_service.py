"""
Drift Detection Service.
Coordinates between OpenTofu plan drift checks and persistence in PostgreSQL.
Adheres strictly to the Zero Fake Data policy.
"""

import logging
from typing import Any, Dict, Optional

from django.utils import timezone
from .iac_service import OpenTofuIaCService

logger = logging.getLogger(__name__)


class DriftDetectionService:
    """
    Coordinates infrastructure drift evaluations.
    Detects when manual changes have been made out-of-band in cloud consoles.
    """

    def __init__(self, iac_service: Optional[OpenTofuIaCService] = None):
        self.iac_service = iac_service or OpenTofuIaCService()

    def check_environment_drift(self, environment: str = "production") -> Dict[str, Any]:
        """
        Runs non-destructive drift detection plan.
        """
        result = self.iac_service.detect_drift(environment)
        
        remediation = None
        if result["is_drifted"]:
            remediation = (
                f"Infrastructure in {environment} has drifted from Git authoritative state. "
                "Review plan differences and run verified OpenTofu apply, or backport cloud changes to code."
            )

        return {
            "environment": environment,
            "is_drifted": result["is_drifted"],
            "status": result["status"],
            "exit_code": result["exit_code"],
            "summary": result["summary"],
            "remediation_plan": remediation,
            "evaluated_at": timezone.now().isoformat(),
        }
