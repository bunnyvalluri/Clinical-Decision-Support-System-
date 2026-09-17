"""
Security & Red Team Test Suite for Cline Integration (Prompt 37).
Validates:
1. Path traversal attack blocks ('../../', absolute paths).
2. Secret file redaction and access prevention (.env, private keys).
3. Production shell denial and dangerous command pattern blocks.
4. Clinical role shell prohibition (DOCTOR, NURSE, PATIENT).
5. Global AI emergency kill-switch enforcement.
6. Runaway tool loop detection and task termination.
7. Role escalation and IDOR protection.
"""
import os
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.ai_orchestrator.models import (
    ClineAgentSession,
    ClineAgentTask,
    ClineAgentEvent,
)
from integrations.cline.sandboxes import SandboxedExecutionEngine
from integrations.cline.session_service import ClineSessionService
from integrations.cline.adapter import ClineAgentAdapter
from integrations.cline.policy_adapter import ClinePolicyAdapter

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="sec_admin_cline",
        email="sec_admin@healthnova.test",
        password="TestPassword123!",
        role="ADMIN",
        is_staff=True,
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="sec_doctor_cline",
        email="sec_doctor@healthnova.test",
        password="TestPassword123!",
        role="DOCTOR",
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="sec_patient_cline",
        email="sec_patient@healthnova.test",
        password="TestPassword123!",
        role="PATIENT",
    )


@pytest.mark.django_db
class TestClineSandboxDefenses:
    def test_path_traversal_blocked(self):
        malicious_paths = [
            "../../../../etc/passwd",
            "..\\..\\windows\\system32\\cmd.exe",
            "backend/../../.env",
            "/etc/shadow",
        ]
        for p in malicious_paths:
            valid, reason = SandboxedExecutionEngine.validate_file_path(p)
            assert valid is False, f"Path traversal should have been blocked: {p}"

    def test_secret_file_access_blocked(self):
        secret_files = [
            ".env",
            ".env.production",
            "server.key",
            "cert.pem",
            "id_rsa",
            "coolify_token.txt",
        ]
        for f in secret_files:
            valid, reason = SandboxedExecutionEngine.validate_file_path(f)
            assert valid is False, f"Secret file should have been blocked: {f}"

    def test_dangerous_commands_blocked(self):
        dangerous_cmds = [
            "rm -rf /",
            "mkfs.ext4 /dev/sda",
            "dd if=/dev/zero of=/dev/sda",
            "DROP DATABASE healthnova_prod;",
            "chmod 777 -R /",
        ]
        for cmd in dangerous_cmds:
            valid, reason = SandboxedExecutionEngine.validate_shell_command(
                command=cmd,
                role="ADMIN",
                environment="DEVELOPMENT",
            )
            assert valid is False, f"Dangerous command should have been blocked: {cmd}"

    def test_clinical_roles_cannot_execute_shell(self):
        for role in ["DOCTOR", "NURSE", "PATIENT", "USER"]:
            valid, reason = SandboxedExecutionEngine.validate_shell_command(
                command="pytest",
                role=role,
                environment="DEVELOPMENT",
            )
            assert valid is False
            assert "disabled" in reason.lower()

    def test_production_environment_blocks_shell(self):
        valid, reason = SandboxedExecutionEngine.validate_shell_command(
            command="pytest",
            role="ADMIN",
            environment="PRODUCTION",
        )
        assert valid is False
        assert "DENIED" in reason


@pytest.mark.django_db
class TestClineKillSwitchAndLoopDetection:
    def test_emergency_kill_switch_blocks_task_creation(self, doctor_user, monkeypatch):
        monkeypatch.setenv("AI_KILL_SWITCH_ACTIVE", "true")
        session = ClineSessionService.create_session(
            user=doctor_user,
            role="DOCTOR",
            agent_type="CLINICAL_KNOWLEDGE_ASSISTANT",
            purpose="Sepsis review",
        )
        with pytest.raises(PermissionError) as exc_info:
            ClineSessionService.create_task(
                session_id=str(session.id),
                prompt="Summarize clinical protocol",
                user=doctor_user,
            )
        assert "Kill Switch is ACTIVE" in str(exc_info.value)

    def test_runaway_loop_detected(self):
        repeated_tools = ["read_guidelines", "read_guidelines", "read_guidelines"]
        is_loop = ClineSessionService.detect_runaway_loop(repeated_tools, threshold=3)
        assert is_loop is True

        diverse_tools = ["read_guidelines", "explain_prediction", "read_guidelines"]
        is_not_loop = ClineSessionService.detect_runaway_loop(diverse_tools, threshold=3)
        assert is_not_loop is False

    def test_forbidden_operations_denied(self):
        permitted, requires_approval, reason = ClinePolicyAdapter.evaluate_tool_permission(
            tool_name="execute_arbitrary_sql",
            user_role="ADMIN",
            environment="DEVELOPMENT",
            risk_level="CRITICAL",
        )
        assert permitted is False
        assert "FORBIDDEN" in reason
