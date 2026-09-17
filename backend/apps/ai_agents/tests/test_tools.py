from django.contrib.auth import get_user_model
from django.test import TestCase
from apps.patients.models import Patient
from apps.clinical.models import ClinicalRecord
from apps.ai_agents.services.tool_registry import ToolRegistry
from apps.ai_agents.tools.search_tools import ExternalSearchTool
from apps.ai_agents.tools.clinical_tools import (
    GetPatientSummaryTool,
    GetPatientVitalsTool,
    GetPatientAppointmentsTool,
)

User = get_user_model()


class AgentToolsTestCase(TestCase):
    def setUp(self):
        ToolRegistry.initialize()
        self.doctor_user = User.objects.create_user(
            username="testdoctor_tool",
            email="doc_tool@hospital.org",
            password="DocPassword123!",
            role="DOCTOR",
        )
        self.patient_user = User.objects.create_user(
            username="testpatient_user",
            email="patient_user@hospital.org",
            password="PatientPassword123!",
            role="PATIENT",
        )
        self.patient = Patient.objects.create(
            mrn="MRN-TOOLS-001",
            first_name="Arthur",
            last_name="Dent",
            gender="MALE",
            blood_group="A+",
            date_of_birth="1978-03-11",
        )
        ClinicalRecord.objects.create(
            patient=self.patient,
            systolic_bp=128,
            diastolic_bp=82,
            heart_rate=74,
            respiratory_rate=16,
            body_temperature=36.8,
            oxygen_saturation=98.5,
            encounter_type="OUTPATIENT",
        )

    def test_tool_registry_contains_expected_tools(self):
        tools = ToolRegistry.get_all_tools()
        self.assertGreaterEqual(len(tools), 15)
        self.assertIsNotNone(ToolRegistry.get_tool("get_patient_vitals"))
        self.assertIsNotNone(ToolRegistry.get_tool("get_patient_summary"))
        self.assertIsNotNone(ToolRegistry.get_tool("get_patient_risk_prediction"))
        self.assertIsNotNone(ToolRegistry.get_tool("search_authorized_clinical_documents"))
        self.assertIsNotNone(ToolRegistry.get_tool("external_search"))

    def test_tool_role_authorization_enforcement(self):
        vitals_tool = GetPatientVitalsTool()
        # Doctor is authorized
        self.assertTrue(vitals_tool.is_authorized("doctor", self.doctor_user.id, str(self.patient.id)))
        # Patient is NOT authorized to query internal clinical vitals tool
        self.assertFalse(vitals_tool.is_authorized("patient", self.patient_user.id, str(self.patient.id)))

    def test_patient_summary_execution(self):
        summary_tool = GetPatientSummaryTool()
        result = summary_tool.run(
            user=self.doctor_user,
            arguments={"patient_id": str(self.patient.id)},
            correlation_id="corr-123",
        )
        self.assertEqual(result.status, "COMPLETED")
        self.assertEqual(result.data["gender"], "MALE")
        self.assertEqual(result.data["blood_group"], "A+")

    def test_patient_vitals_execution(self):
        vitals_tool = GetPatientVitalsTool()
        result = vitals_tool.run(
            user=self.doctor_user,
            arguments={"patient_id": str(self.patient.id), "limit": 5},
            correlation_id="corr-456",
        )
        self.assertEqual(result.status, "COMPLETED")
        self.assertEqual(len(result.data["vitals"]), 1)
        self.assertEqual(result.data["vitals"][0]["heart_rate"], 74)
        self.assertEqual(result.data["vitals"][0]["systolic_bp"], 128)

    def test_external_search_ssrf_protection(self):
        search_tool = ExternalSearchTool()
        # Disallowed external IP / loopback
        self.assertFalse(search_tool.is_safe_target("http://127.0.0.1:8000/api"))
        self.assertFalse(search_tool.is_safe_target("http://169.254.169.254/latest/meta-data"))
        self.assertFalse(search_tool.is_safe_target("http://malicious-site.com/exploit"))

        # Approved medical repositories
        self.assertTrue(search_tool.is_safe_target("https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12345/"))
        self.assertTrue(search_tool.is_safe_target("https://www.cdc.gov/sepsis/protocol/index.html"))
        self.assertTrue(search_tool.is_safe_target("https://www.nejm.org/doi/full/10.1056/NEJMoa2026001"))
