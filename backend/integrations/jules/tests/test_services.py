from django.test import TestCase
from django.contrib.auth import get_user_model
from integrations.jules.models import JulesRemediationJob, RemediationJobStatus, JulesSource
from integrations.jules.services import JulesRemediationService, JulesSourceSyncService

User = get_user_model()


class JulesServicesTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin_jules@healthnova.ai",
            email="admin_jules@healthnova.ai",
            password="testpassword123",
            role="IT_ADMIN",
        )

    def test_sync_sources_creates_sources(self):
        sources = JulesSourceSyncService.sync_sources(actor_id=self.admin_user.email)
        self.assertGreater(len(sources), 0)
        self.assertTrue(JulesSource.objects.filter(github_repository="Clinical-Decision-Support-System-").exists())

    def test_create_remediation_job(self):
        job = JulesRemediationService.create_remediation_job(
            title="Fix TypeScript Type Mismatch in VitalsTable",
            issue_category="TYPESCRIPT_ERROR",
            description="Type number is not assignable to string in timestamp column.",
            repository="HealthNova-AI",
            branch="develop",
            severity="MEDIUM",
            created_by=self.admin_user,
            actor_role="IT_ADMIN",
        )
        self.assertIsNotNone(job.correlation_id)
        self.assertTrue(job.correlation_id.startswith("HN-JULES-"))
        self.assertEqual(job.title, "Fix TypeScript Type Mismatch in VitalsTable")

    def test_approve_plan_transitions_job_state(self):
        job = JulesRemediationService.create_remediation_job(
            title="Fix Flaky Unit Test in ML Evaluation",
            issue_category="TEST_FAILURE",
            description="Race condition in mock telemetry emitter.",
            repository="HealthNova-AI",
            branch="develop",
            severity="LOW",
            created_by=self.admin_user,
            actor_role="IT_ADMIN",
        )
        # In test mode, start_session_for_job generates a mock session
        JulesRemediationService.start_session_for_job(job, actor_id=self.admin_user.email)
        self.assertEqual(job.status, RemediationJobStatus.PLAN_PENDING_APPROVAL)

        # Approve plan
        approval = JulesRemediationService.approve_plan(job, approver_user=self.admin_user, reason="Looks safe.")
        job.refresh_from_db()
        self.assertEqual(job.status, RemediationJobStatus.EXECUTING)
        self.assertEqual(approval.status, "APPROVED")
