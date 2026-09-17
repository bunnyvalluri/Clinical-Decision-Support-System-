"""
Common Security Testing Provider Abstraction (Prompt 44).
Normalizes security operations across:
- Prompt 28: Agentic Bug Hunter
- Prompt 42: Strix AI Pentesting Engine
- Prompt 44: H-mmer Pentest-Agents Framework

All providers produce normalized SecurityAssessment (SecurityScan), SecurityFinding,
SecurityEvidence, and SecurityReport records with strict policy governance.
"""
from abc import ABC, abstractmethod
import logging
import json
from typing import Dict, Any, List, Optional, Tuple

from apps.security_testing.models import (
    SecurityTarget,
    SecurityScan,
    SecurityAssessment,
    SecurityFinding,
    SecurityEvidence,
    SecurityReport,
    SecurityAgentRun,
    SecurityProviderType,
    AgentRunStatus,
    FindingState,
)
from apps.security_testing.services.policy_engine import SecurityPolicyEngine

logger = logging.getLogger("security_testing.provider_abstraction")


class SecurityTestingProvider(ABC):
    """
    Unified abstract interface for all security testing engines.
    Guarantees that regardless of the underlying engine, all execution adheres to:
    - Target authorization & scope allowlisting
    - Non-root, zero-PHI ephemeral execution
    - Normalized finding creation and 7-question validation
    """

    @property
    @abstractmethod
    def provider_type(self) -> SecurityProviderType:
        """Returns the canonical SecurityProviderType enum."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider label."""
        pass

    @abstractmethod
    def validate_target(self, target: SecurityTarget, user=None) -> Tuple[bool, str]:
        """Validates that target is authorized and in-scope."""
        pass

    @abstractmethod
    def execute_assessment(
        self, assessment: SecurityScan, agent_run: Optional[SecurityAgentRun] = None
    ) -> Dict[str, Any]:
        """
        Executes the assessment task, updating agent_run and creating findings.
        Returns execution summary dict.
        """
        pass

    @abstractmethod
    def retest(self, finding: SecurityFinding, agent_run: Optional[SecurityAgentRun] = None) -> Tuple[bool, str]:
        """Verifies whether a previously identified vulnerability has been fixed."""
        pass

    @abstractmethod
    def cleanup(self, assessment: SecurityScan) -> None:
        """Cleans up ephemeral workspaces, memory allocations, and temporary files."""
        pass


class StrixProvider(SecurityTestingProvider):
    """
    Adapter implementation for Strix AI Pentesting Engine (Prompt 42).
    """

    @property
    def provider_type(self) -> SecurityProviderType:
        return SecurityProviderType.STRIX

    @property
    def display_name(self) -> str:
        return "Strix AI Security Engine"

    def validate_target(self, target: SecurityTarget, user=None) -> Tuple[bool, str]:
        return SecurityPolicyEngine.can_scan_target(target, user)

    def execute_assessment(
        self, assessment: SecurityScan, agent_run: Optional[SecurityAgentRun] = None
    ) -> Dict[str, Any]:
        from apps.security_testing.services.strix_adapter import StrixSecurityAdapter

        adapter = StrixSecurityAdapter()
        adapter.initialize(assessment)
        findings = adapter.scan(assessment)

        if agent_run:
            agent_run.status = AgentRunStatus.COMPLETED
            agent_run.result = {
                "findings_count": len(findings),
                "strix_version": adapter.strix_version,
            }
            agent_run.save()

        return {
            "status": "COMPLETED",
            "findings_discovered": len(findings),
            "provider": self.provider_type,
        }

    def retest(self, finding: SecurityFinding, agent_run: Optional[SecurityAgentRun] = None) -> Tuple[bool, str]:
        from apps.security_testing.services.retest import RetestService
        return RetestService.execute_retest(finding)

    def cleanup(self, assessment: SecurityScan) -> None:
        pass


class AgenticBugHunterProvider(SecurityTestingProvider):
    """
    Adapter implementation for Agentic Bug Hunter internal testing toolkit (Prompt 28).
    """

    @property
    def provider_type(self) -> SecurityProviderType:
        return SecurityProviderType.AGENTIC_BUGHUNTER

    @property
    def display_name(self) -> str:
        return "Agentic Bug Hunter Toolkit"

    def validate_target(self, target: SecurityTarget, user=None) -> Tuple[bool, str]:
        return SecurityPolicyEngine.can_scan_target(target, user)

    def execute_assessment(
        self, assessment: SecurityScan, agent_run: Optional[SecurityAgentRun] = None
    ) -> Dict[str, Any]:
        from apps.security_testing.services.adapter import AgenticBugHunterAdapter

        adapter = AgenticBugHunterAdapter()
        adapter.initialize(assessment)
        findings = adapter.scan(assessment)

        if agent_run:
            agent_run.status = AgentRunStatus.COMPLETED
            agent_run.result = {"findings_count": len(findings)}
            agent_run.save()

        return {
            "status": "COMPLETED",
            "findings_discovered": len(findings),
            "provider": self.provider_type,
        }

    def retest(self, finding: SecurityFinding, agent_run: Optional[SecurityAgentRun] = None) -> Tuple[bool, str]:
        from apps.security_testing.services.retest import RetestService
        return RetestService.execute_retest(finding)

    def cleanup(self, assessment: SecurityScan) -> None:
        pass


class PentestAgentsProvider(SecurityTestingProvider):
    """
    Adapter implementation for H-mmer Pentest-Agents Framework (Prompt 44).
    Delegates to backend/integrations/pentest_agents/ with workspace isolation.
    """

    @property
    def provider_type(self) -> SecurityProviderType:
        return SecurityProviderType.PENTEST_AGENTS

    @property
    def display_name(self) -> str:
        return "H-mmer Pentest-Agents Framework"

    def validate_target(self, target: SecurityTarget, user=None) -> Tuple[bool, str]:
        from integrations.pentest_agents.policies import PentestAgentsPolicyEngine
        return PentestAgentsPolicyEngine.validate_target_and_scope(target, user)

    def execute_assessment(
        self, assessment: SecurityScan, agent_run: Optional[SecurityAgentRun] = None
    ) -> Dict[str, Any]:
        from integrations.pentest_agents.service import PentestAgentsService
        return PentestAgentsService.execute_agent_run(assessment=assessment, agent_run=agent_run)

    def retest(self, finding: SecurityFinding, agent_run: Optional[SecurityAgentRun] = None) -> Tuple[bool, str]:
        from integrations.pentest_agents.service import PentestAgentsService
        return PentestAgentsService.execute_retest(finding=finding, agent_run=agent_run)

    def cleanup(self, assessment: SecurityScan) -> None:
        from integrations.pentest_agents.runner import WorkspaceSandboxManager
        WorkspaceSandboxManager.cleanup_workspace(str(assessment.id))
