from django.test import SimpleTestCase
from integrations.jules.policies import JulesPolicyEngine, PolicyDecision
from integrations.jules.exceptions import JulesPolicyViolationError


class JulesPolicyEngineTests(SimpleTestCase):
    def test_denies_direct_modification_of_main_branch(self):
        decision = JulesPolicyEngine.evaluate(
            repository="HealthNova-AI",
            branch="main",
            issue_category="BUILD_FAILURE",
            severity="MEDIUM",
            user_role="IT_ADMIN",
        )
        self.assertEqual(decision, PolicyDecision.DENY)

    def test_denies_unauthorized_role(self):
        decision = JulesPolicyEngine.evaluate(
            repository="HealthNova-AI",
            branch="develop",
            issue_category="BUILD_FAILURE",
            severity="MEDIUM",
            user_role="DOCTOR",
        )
        self.assertEqual(decision, PolicyDecision.DENY)

    def test_allows_with_approval_for_sensitive_database_or_security(self):
        decision = JulesPolicyEngine.evaluate(
            repository="HealthNova-AI",
            branch="develop",
            issue_category="SECURITY_FINDING",
            severity="HIGH",
            user_role="IT_ADMIN",
        )
        self.assertEqual(decision, PolicyDecision.ALLOW_WITH_APPROVAL)

    def test_enforce_or_raise_throws_on_deny(self):
        with self.assertRaises(JulesPolicyViolationError):
            JulesPolicyEngine.enforce_or_raise(
                repository="HealthNova-AI",
                branch="production",
                issue_category="API_ERROR",
                severity="CRITICAL",
                user_role="PATIENT",
            )
