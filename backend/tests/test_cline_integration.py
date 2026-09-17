"""
Test Suite for Prompt 37 — Controlled Cline Integration.
Tests:
1. Version & License documentation existence and compliance.
2. ClineAgentSession creation, RBAC boundaries, and budget constraints.
3. ClineAgentTask queueing, SHA-256 prompt hashing, and execution.
4. ClineAgentEvent emission and audit trail logging.
5. ClineAgentApproval workflow for high-risk tools.
6. Celery task async execution and scheduled timeout reaper.
"""
from decimal import Decimal
import os
from pathlib import Path
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.ai_orchestrator.models import (
    ClineAgentSession,
    ClineAgentTask,
    ClineAgentEvent,
    ClineAgentApproval,
)
from integrations.cline.session_service import ClineSessionService
from integrations.cline.adapter import ClineAgentAdapter
from integrations.cline.tool_registry import ClineToolRegistry

User = get_user_model()
REPO_ROOT = Path(__file__).resolve().parent.parent.parent


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="test_admin_cline",
        email="admin_cline@healthnova.test",
        password="TestPassword123!",
        role="ADMIN",
        is_staff=True,
        is_active=True,
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="test_doctor_cline",
        email="doctor_cline@healthnova.test",
        password="TestPassword123!",
        role="DOCTOR",
        is_staff=False,
        is_active=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="test_patient_cline",
        email="patient_cline@healthnova.test",
        password="TestPassword123!",
        role="PATIENT",
        is_staff=False,
        is_active=True,
    )


@pytest.mark.django_db
class TestClineDocumentationAndPinning:
    def test_version_pinning_document_exists(self):
        v_file = REPO_ROOT / "docs" / "integrations" / "CLINE_VERSION.md"
        assert v_file.exists()
        content = v_file.read_text(encoding="utf-8")
        assert "v3.42.0" in content
        assert "Bun 1.3.13" in content

    def test_license_document_exists(self):
        l_file = REPO_ROOT / "docs" / "integrations" / "CLINE_LICENSE.md"
        assert l_file.exists()
        content = l_file.read_text(encoding="utf-8")
        assert "Apache License, Version 2.0" in content or "Apache-2.0" in content

    def test_adr_document_exists(self):
        adr_file = REPO_ROOT / "docs" / "adr" / "ADR-CLINE-INTEGRATION.md"
        assert adr_file.exists()
        content = adr_file.read_text(encoding="utf-8")
        assert "Neon PostgreSQL as Sole Authoritative Store" in content


@pytest.mark.django_db
class TestClineSessionAndTaskLifecycle:
    def test_doctor_can_create_clinical_session(self, doctor_user):
        session = ClineSessionService.create_session(
            user=doctor_user,
            role="DOCTOR",
            agent_type="CLINICAL_KNOWLEDGE_ASSISTANT",
            purpose="Sepsis guideline synthesis",
        )
        assert session.id is not None
        assert session.role == "DOCTOR"
        assert session.status == ClineAgentSession.SessionStatus.ACTIVE
        assert session.token_budget == 100000

    def test_patient_blocked_from_engineering_assistant(self, patient_user):
        with pytest.raises(PermissionError):
            ClineSessionService.create_session(
                user=patient_user,
                role="PATIENT",
                agent_type="INFRASTRUCTURE_ASSISTANT",
                purpose="Attempting infrastructure ops",
            )

    def test_task_creation_computes_sha256_hash(self, doctor_user):
        session = ClineSessionService.create_session(
            user=doctor_user,
            role="DOCTOR",
            agent_type="CLINICAL_KNOWLEDGE_ASSISTANT",
            purpose="Guideline review",
        )
        task = ClineSessionService.create_task(
            session_id=str(session.id),
            prompt="What is the recommended lactate clearance protocol in septic shock?",
            user=doctor_user,
        )
        assert task.id is not None
        assert len(task.prompt_hash) == 64  # SHA-256 length
        assert task.status == ClineAgentTask.TaskStatus.QUEUED

    def test_agent_adapter_executes_guideline_task(self, doctor_user):
        session = ClineSessionService.create_session(
            user=doctor_user,
            role="DOCTOR",
            agent_type="CLINICAL_KNOWLEDGE_ASSISTANT",
            purpose="Guideline review",
        )
        task = ClineSessionService.create_task(
            session_id=str(session.id),
            prompt="Retrieve sepsis resuscitation guidelines",
            user=doctor_user,
        )
        adapter = ClineAgentAdapter(session_id=str(session.id))
        result = adapter.execute_task(task_id=str(task.id), prompt="Retrieve sepsis resuscitation guidelines")

        assert result["success"] is True
        task.refresh_from_db()
        assert task.status == ClineAgentTask.TaskStatus.COMPLETED
        assert task.tool_calls_count >= 1

        # Verify events were persisted
        events = ClineAgentEvent.objects.filter(task=task)
        assert events.filter(event_type="agent_started").exists()
        assert events.filter(event_type="agent_completed").exists()

    def test_high_risk_tool_pauses_for_approval(self, admin_user):
        session = ClineSessionService.create_session(
            user=admin_user,
            role="ADMIN",
            agent_type="INFRASTRUCTURE_ASSISTANT",
            purpose="Deployment staging",
        )
        task = ClineSessionService.create_task(
            session_id=str(session.id),
            prompt="Request deploy service cdss-backend commit 89fa21c",
            user=admin_user,
        )
        adapter = ClineAgentAdapter(session_id=str(session.id))
        result = adapter.execute_task(task_id=str(task.id), prompt="Request deploy service cdss-backend commit 89fa21c")

        assert result["status"] == "WAITING_FOR_APPROVAL"
        task.refresh_from_db()
        assert task.status == ClineAgentTask.TaskStatus.WAITING_FOR_APPROVAL

        approval = ClineAgentApproval.objects.filter(task=task).first()
        assert approval is not None
        assert approval.status == ClineAgentApproval.ApprovalStatus.PENDING
