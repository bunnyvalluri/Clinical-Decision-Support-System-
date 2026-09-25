"""
Abstract Browser Agent Provider Interface for HealthNova AI.
Ensures strict decoupling: application code only interacts with the provider interface,
never directly importing or executing raw browser automation drivers.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BrowserAgentProvider(ABC):
    """
    Standard interface for controlled browser agent runtimes in HealthNova AI.
    """

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique machine identifier for the provider (e.g., 'jev-ultrafast')."""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Provider implementation version."""
        pass

    @abstractmethod
    def create_task(self, task_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate task requirements, create persistent state, and return created task context.
        """
        pass

    @abstractmethod
    def validate_task(self, task_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform safety checks: SSRF, destination allowlist, risk classification, approval check.
        Returns: Dict containing 'is_valid', 'risk_level', 'approval_required', 'reason'.
        """
        pass

    @abstractmethod
    def start_task(self, task_id: str) -> Dict[str, Any]:
        """
        Execute an approved task through controlled step loop.
        """
        pass

    @abstractmethod
    def pause_task(self, task_id: str) -> Dict[str, Any]:
        """
        Pause an executing browser automation task.
        """
        pass

    @abstractmethod
    def resume_task(self, task_id: str) -> Dict[str, Any]:
        """
        Resume a paused browser automation task.
        """
        pass

    @abstractmethod
    def cancel_task(self, task_id: str, reason: str = "User cancelled") -> Dict[str, Any]:
        """
        Immediately halt execution, release browser resources, and record cancellation audit.
        """
        pass

    @abstractmethod
    def get_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get current task execution state, elapsed time, and step summary.
        """
        pass

    @abstractmethod
    def get_trace(self, task_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve structured step-by-step execution history (zero PHI, sanitized).
        """
        pass

    @abstractmethod
    def verify_result(self, task_id: str) -> Dict[str, Any]:
        """
        Perform independent verification of the task outcome (DONE != SUCCESS).
        """
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """
        Return honest runtime health diagnostics without fabricating status.
        """
        pass
