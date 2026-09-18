"""
Client adapters and dependency injection for Google Jules integration.
Provides RealJulesClient for production and MockJulesClient for offline/testing environments.
"""
from typing import Dict, Any, Optional
from integrations.jules.client import JulesClient
from integrations.jules.config import get_jules_settings


class MockJulesClient:
    """
    In-memory mock client for tests and local development.
    Avoids real HTTP calls while accurately simulating Google Jules v1alpha responses.
    """
    def __init__(self):
        self.sources = [
            {
                "name": "sources/github/HealthNova-AI/Clinical-Decision-Support-System-",
                "id": "github-cds-system",
                "githubRepo": {
                    "owner": "bunnyvalluri",
                    "repo": "Clinical-Decision-Support-System-",
                    "isPrivate": True,
                    "defaultBranch": "main",
                    "branches": ["main", "develop", "feature/jules", "bugfix/ci-remediation"],
                },
            }
        ]
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.activities: Dict[str, list] = {}

    def list_sources(self, page_size: int = 20, page_token: Optional[str] = None) -> Dict[str, Any]:
        return {"sources": self.sources}

    def get_source(self, source_name: str) -> Dict[str, Any]:
        for s in self.sources:
            if s["name"] == source_name or s["name"].endswith(source_name):
                return s
        return self.sources[0]

    def create_session(
        self,
        prompt: str,
        source_name: str,
        starting_branch: str = "develop",
        title: Optional[str] = None,
        require_plan_approval: bool = True,
        automation_mode: str = "NONE",
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        session_id = f"sessions/mock-{len(self.sessions) + 1:04d}"
        session_data = {
            "name": session_id,
            "title": title or "Mock Automated Remediation Session",
            "prompt": prompt,
            "sourceContext": {
                "source": source_name,
                "githubRepoContext": {
                    "startingBranch": starting_branch,
                },
            },
            "state": "PLANNING" if require_plan_approval else "EXECUTING",
            "requirePlanApproval": require_plan_approval,
            "automationMode": automation_mode,
        }
        self.sessions[session_id] = session_data
        self.activities[session_id] = [
            {
                "name": f"{session_id}/activities/act-001",
                "activityType": "PLAN_GENERATED",
                "originator": "JULES",
                "description": "Mock plan generated: investigate affected files and propose targeted patch.",
            }
        ]
        return session_data

    def get_session(self, session_id: str) -> Dict[str, Any]:
        clean_id = session_id if session_id.startswith("sessions/") else f"sessions/{session_id}"
        if clean_id in self.sessions:
            return self.sessions[clean_id]
        return {
            "name": clean_id,
            "title": "Mock Session",
            "state": "COMPLETED",
        }

    def list_sessions(self, page_size: int = 20, page_token: Optional[str] = None) -> Dict[str, Any]:
        return {"sessions": list(self.sessions.values())}

    def approve_plan(self, session_id: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        clean_id = session_id if session_id.startswith("sessions/") else f"sessions/{session_id}"
        if clean_id in self.sessions:
            self.sessions[clean_id]["state"] = "EXECUTING"
            self.activities.setdefault(clean_id, []).append(
                {
                    "name": f"{clean_id}/activities/act-{len(self.activities[clean_id]) + 1:03d}",
                    "activityType": "PLAN_APPROVED",
                    "originator": "USER",
                    "description": "Plan approved by IT Admin. Execution underway.",
                }
            )
        return {"status": "APPROVED"}

    def send_message(self, session_id: str, message: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        clean_id = session_id if session_id.startswith("sessions/") else f"sessions/{session_id}"
        self.activities.setdefault(clean_id, []).append(
            {
                "name": f"{clean_id}/activities/act-{len(self.activities.get(clean_id, [])) + 1:03d}",
                "activityType": "MESSAGE",
                "originator": "USER",
                "description": message,
            }
        )
        return {"status": "MESSAGE_DELIVERED"}

    def list_activities(self, session_id: str, page_size: int = 50, page_token: Optional[str] = None) -> Dict[str, Any]:
        clean_id = session_id if session_id.startswith("sessions/") else f"sessions/{session_id}"
        return {"activities": self.activities.get(clean_id, [])}


def get_jules_client(force_mock: bool = False):
    """
    Factory providing RealJulesClient in production or MockJulesClient in test environments.
    """
    settings = get_jules_settings()
    if force_mock or settings.environment == "test" or not settings.is_configured:
        return MockJulesClient()
    return JulesClient()
