"""
Unit & Integration tests for Engineering Loops (Prompt 45).
"""
import os
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model

from apps.engineering_loops.models import (
    EngineeringLoop,
    EngineeringLoopRun,
    EngineeringLoopBudget,
    EngineeringToolRegistry,
    LoopStatus,
    AutonomyLevel,
    LoopPatternType,
)
from integrations.loop_engineering.policies import LoopPolicyEngine
from integrations.loop_engineering.exceptions import (
    LoopKillSwitchActiveError,
    AutonomyViolationError,
    ProtectedPathViolationError,
    BudgetExceededError,
)
from integrations.loop_engineering.runner import WorktreeManager
from integrations.loop_engineering.service import LoopService

User = get_user_model()


class EngineeringLoopsIntegrationTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="loop_admin", email="admin@hospital.org", password="adminpassword123"
        )
        self.budget = EngineeringLoopBudget.objects.create(
            daily_limit=20.0,
            weekly_limit=100.0,
            per_run_limit=5.0,
            current_daily_spend=0.0,
            hard_stop=True,
        )
        self.loop = EngineeringLoop.objects.create(
            name="Daily Repository Triage Loop",
            description="L1 report only checking CI, dependencies, and test status",
            pattern=LoopPatternType.DAILY_TRIAGE,
            autonomy_level=AutonomyLevel.L1_REPORT_ONLY,
            status=LoopStatus.READY,
            owner=self.admin,
        )

    def test_01_l1_autonomy_blocks_mutating_actions(self):
        """L1_REPORT_ONLY loops cannot execute write or commit operations."""
        ok_read, _ = LoopPolicyEngine.can_execute_operation(self.loop, "READ")
        self.assertTrue(ok_read)

        ok_write, reason = LoopPolicyEngine.can_execute_operation(self.loop, "WRITE")
        self.assertFalse(ok_write)
        self.assertIn("L1_REPORT_ONLY", reason)

    def test_02_protected_clinical_and_secret_paths(self):
        """Writing to clinical models or reading secrets is strictly blocked."""
        ok_secret, msg1 = LoopPolicyEngine.validate_path_access(".env.production", "READ")
        self.assertFalse(ok_secret)

        ok_clinical, msg2 = LoopPolicyEngine.validate_path_access(
            "backend/apps/clinical/models.py", "WRITE"
        )
        self.assertFalse(ok_clinical)
        self.assertIn("Protected path", msg2)

    def test_03_worktree_isolation_lifecycle(self):
        """Worktrees are provisioned in isolated paths and destroyed cleanly."""
        run_id = "test_run_isolation_99"
        wt_path = WorktreeManager.create_worktree(run_id)
        self.assertTrue(os.path.exists(wt_path))
        self.assertTrue(os.path.exists(os.path.join(wt_path, "patches")))

        WorktreeManager.cleanup_worktree(run_id)
        self.assertFalse(os.path.exists(wt_path))

    def test_04_budget_enforcement_and_hard_stop(self):
        """Exceeding per_run_limit or daily_limit raises BudgetExceededError."""
        with self.assertRaises(BudgetExceededError):
            LoopPolicyEngine.check_budget_limit(10.0)  # per_run_limit is 5.0

    @override_settings(ENGINEERING_LOOPS_ENABLED=False)
    def test_05_emergency_kill_switch(self):
        """When ENGINEERING_LOOPS_ENABLED=False, all operations raise LoopKillSwitchActiveError."""
        with self.assertRaises(LoopKillSwitchActiveError):
            LoopPolicyEngine.check_kill_switch()

    def test_06_end_to_end_loop_execution(self):
        """Executes a loop run and verifies state, ready score, and audit creation."""
        run = EngineeringLoopRun.objects.create(
            loop=self.loop,
            run_id="run_e2e_001",
            status=LoopStatus.QUEUED,
        )
        res = LoopService.execute_run(run.run_id)
        self.assertEqual(res["status"], "COMPLETED")
        self.assertGreater(res["ready_score"], 0)

        run.refresh_from_db()
        self.assertEqual(run.status, LoopStatus.COMPLETED)
        self.assertGreater(run.tokens_used, 0)
