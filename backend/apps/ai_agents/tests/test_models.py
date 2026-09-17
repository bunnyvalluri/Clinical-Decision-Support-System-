import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from apps.patients.models import Patient
from apps.ai_agents.models import (
    AgentDefinition,
    AgentSession,
    AgentExecution,
    AgentMessage,
    AgentToolDefinition,
    AgentToolExecution,
    AgentApproval,
    AgentMemory,
    AgentProviderExecution,
    AgentSafetyEvent,
    AgentEvaluation,
    AgentFeedback,
    AgentRoleType,
    AgentSessionStatus,
    AgentExecutionStatus,
    AgentSecurityLevel,
    ApprovalStatus,
    DataClassification,
    MemoryType,
    SafetyEventType,
    FeedbackRating,
)

User = get_user_model()


class AgentModelsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testdoctor",
            email="doctor@hospital.org",
            password="SecurePassword123!",
            role="DOCTOR",
        )
        self.patient = Patient.objects.create(
            mrn="MRN-2026-TEST",
            first_name="Jane",
            last_name="Doe",
            gender="FEMALE",
            blood_group="O+",
            date_of_birth="1985-06-15",
        )
        self.agent_def = AgentDefinition.objects.create(
            name="Clinical Physician Agent",
            slug="physician-agent",
            version="1.0.0",
            security_level=AgentSecurityLevel.HIGH,
            role_type=AgentRoleType.DOCTOR,
            allowed_roles=["DOCTOR"],
            allowed_tools=["get_patient_vitals", "get_patient_summary"],
            system_prompt="You are a clinical decision-support assistant.",
            max_iterations=5,
            timeout_seconds=30,
            enabled=True,
        )

    def test_agent_definition_creation(self):
        self.assertEqual(str(self.agent_def), "Clinical Physician Agent v1.0.0 (HIGH)")
        self.assertTrue(self.agent_def.enabled)
        self.assertEqual(self.agent_def.role_type, AgentRoleType.DOCTOR)

    def test_agent_session_and_execution_lifecycle(self):
        session = AgentSession.objects.create(
            agent_definition=self.agent_def,
            agent_type=AgentRoleType.DOCTOR,
            user=self.user,
            role="DOCTOR",
            patient=self.patient,
            title="Sepsis Triage Consultation",
            status=AgentSessionStatus.CREATED,
            provider="ollama",
            model="medllama3:latest",
        )
        self.assertIn("Sepsis Triage Consultation", str(session))
        self.assertEqual(session.patient, self.patient)

        execution = AgentExecution.objects.create(
            session=session,
            request_id="REQ-1001",
            user_query="Evaluate patient vitals for possible deterioration",
            status=AgentExecutionStatus.STARTED,
            provider="ollama",
            model="medllama3:latest",
            iteration_count=1,
            tool_call_count=2,
            latency_ms=145,
        )
        self.assertIn("Execution", str(execution))
        self.assertEqual(execution.status, AgentExecutionStatus.STARTED)

        msg = AgentMessage.objects.create(
            session=session,
            execution=execution,
            role="assistant",
            content="Patient vitals are stable. Lactic acid is within normal limits.",
            citations=[{"title": "Surviving Sepsis Campaign 2021"}],
            grounding_status="GROUNDED",
            grounding_confidence=0.98,
        )
        self.assertIn("assistant", str(msg))
        self.assertEqual(msg.grounding_confidence, 0.98)

    def test_tool_definition_and_execution_audit(self):
        tool_def = AgentToolDefinition.objects.create(
            name="get_patient_vitals",
            display_name="Get Patient Vitals",
            description="Fetch latest physiological vitals.",
            category="clinical",
            version="1.0.0",
            risk_level=AgentSecurityLevel.HIGH,
            allowed_roles=["DOCTOR", "NURSE"],
            patient_data_access=True,
            approval_required=False,
            enabled=True,
        )
        self.assertTrue(tool_def.enabled)
        self.assertTrue(tool_def.patient_data_access)

        session = AgentSession.objects.create(
            agent_definition=self.agent_def,
            user=self.user,
            role="DOCTOR",
            patient=self.patient,
        )
        execution = AgentExecution.objects.create(
            session=session,
            user_query="Check vitals",
        )

        tool_exec = AgentToolExecution.objects.create(
            execution=execution,
            tool_name="get_patient_vitals",
            user=self.user,
            role="DOCTOR",
            patient_scope=self.patient,
            authorization_decision="AUTHORIZED",
            execution_time_ms=12.5,
            status="COMPLETED",
            sanitized_input={"patient_id": str(self.patient.id)},
            output_metadata={"count": 5},
        )
        self.assertEqual(tool_exec.status, "COMPLETED")
        self.assertEqual(tool_exec.patient_scope, self.patient)

    def test_agent_approval_gate(self):
        session = AgentSession.objects.create(
            agent_definition=self.agent_def,
            user=self.user,
            role="DOCTOR",
            patient=self.patient,
        )
        execution = AgentExecution.objects.create(
            session=session,
            user_query="Escalate care to ICU",
        )
        approval = AgentApproval.objects.create(
            execution=execution,
            session=session,
            requested_action="ESCALATE_TO_ICU",
            reason="Lactic acid rising > 4.0 mmol/L with refractory hypotension.",
            affected_patient=self.patient,
            risk_level=AgentSecurityLevel.CRITICAL,
            evidence_summary={"lactic_acid": 4.2, "map": 62},
            action_payload={"target_unit": "Medical ICU"},
            approving_role="DOCTOR",
            status=ApprovalStatus.REQUESTED,
            expires_at=timezone.now() + timezone.timedelta(hours=1),
        )
        self.assertEqual(approval.status, ApprovalStatus.REQUESTED)
        self.assertEqual(approval.risk_level, AgentSecurityLevel.CRITICAL)

    def test_agent_memory_classification_isolation(self):
        session = AgentSession.objects.create(
            agent_definition=self.agent_def,
            user=self.user,
            role="DOCTOR",
            patient=self.patient,
        )
        mem = AgentMemory.objects.create(
            session=session,
            user=self.user,
            memory_type=MemoryType.SHORT_TERM_AGENT_STATE,
            key="last_assessed_vitals_summary",
            value={"summary": "HR 78, BP 122/80, SpO2 98%"},
            data_classification=DataClassification.LOW_SENSITIVITY,
        )
        self.assertEqual(mem.data_classification, DataClassification.LOW_SENSITIVITY)
        self.assertIn("last_assessed_vitals_summary", str(mem))

    def test_safety_event_logging(self):
        event = AgentSafetyEvent.objects.create(
            event_type=SafetyEventType.PROMPT_INJECTION,
            severity="CRITICAL",
            user=self.user,
            details={"pattern": "system prompt override attempt"},
            action_taken="BLOCKED",
        )
        self.assertEqual(event.action_taken, "BLOCKED")
        self.assertEqual(event.severity, "CRITICAL")
