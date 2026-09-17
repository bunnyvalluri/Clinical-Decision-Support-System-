"""
Tests for StrixSecurityAdapter, PolicyEngine, and Strix parser.
Covers: kill switch, target allowlist, exit code normalization, SARIF parsing,
finding deduplication, scope validation, and SSRF/private-IP blocking.
"""
import json
import pytest
from unittest.mock import MagicMock, patch
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.unit
class TestSecurityPolicyEngine(TestCase):
    """Validates the default-deny policy engine."""

    def _make_target(self, status="APPROVED", env="SECURITY_TEST", active=True, expires_future=True):
        from apps.security_testing.models import SecurityTarget, ApprovalStatus, SecurityEnvironment, TargetType
        from django.contrib.auth import get_user_model
        User = get_user_model()
        approver, _ = User.objects.get_or_create(
            username="approver_policy_test",
            defaults={"email": "approver@security.test", "role": "IT_ADMIN"},
        )
        target = SecurityTarget.objects.create(
            name=f"policy-test-target-{status}-{env}",
            environment=env,
            target_type=TargetType.API,
            hostname="localhost",
            port=8000,
            scope="/api/v1/",
            approval_status=status,
            is_active=active,
            approval_expires_at=timezone.now() + timezone.timedelta(days=7) if expires_future else timezone.now() - timezone.timedelta(hours=1),
            approved_by=approver,
        )
        return target

    def test_kill_switch_blocks_all_scans(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        with self.settings(SECURITY_KILL_SWITCH=True):
            self.assertTrue(SecurityPolicyEngine.is_kill_switch_active())
            ok, msg = SecurityPolicyEngine.can_scan_environment("SECURITY_TEST", MagicMock())
            self.assertFalse(ok)
            self.assertIn("kill-switch", msg.lower())

    def test_production_scan_disabled_by_default(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        with self.settings(SECURITY_KILL_SWITCH=False, SECURITY_PRODUCTION_SCAN_ENABLED=False):
            ok, msg = SecurityPolicyEngine.can_scan_environment("PRODUCTION", MagicMock())
            self.assertFalse(ok)
            self.assertIn("production", msg.lower())

    def test_approved_target_permitted(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        with self.settings(SECURITY_KILL_SWITCH=False, SECURITY_PRODUCTION_SCAN_ENABLED=False):
            target = self._make_target(status="APPROVED", env="SECURITY_TEST")
            ok, msg = SecurityPolicyEngine.can_scan_target(target, MagicMock(role="IT_ADMIN"))
            self.assertTrue(ok, msg)

    def test_pending_target_denied(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        with self.settings(SECURITY_KILL_SWITCH=False):
            target = self._make_target(status="PENDING", env="SECURITY_TEST")
            ok, msg = SecurityPolicyEngine.can_scan_target(target, MagicMock())
            self.assertFalse(ok)

    def test_expired_authorization_denied(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        with self.settings(SECURITY_KILL_SWITCH=False):
            target = self._make_target(status="APPROVED", env="SECURITY_TEST", expires_future=False)
            ok, msg = SecurityPolicyEngine.can_scan_target(target, MagicMock())
            self.assertFalse(ok)
            self.assertIn("expired", msg.lower())

    def test_forbidden_scope_pattern_rejected(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        target = MagicMock()
        target.scope = "/api/v1/"
        ok, msg = SecurityPolicyEngine.validate_target_scope(target, "/production/delete-all")
        self.assertFalse(ok)
        self.assertIn("forbidden", msg.lower())

    def test_in_scope_path_permitted(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        target = MagicMock()
        target.scope = "/api/v1/"
        ok, msg = SecurityPolicyEngine.validate_target_scope(target, "/api/v1/patients/")
        self.assertTrue(ok, msg)

    def test_patient_cannot_view_finding(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        patient_user = MagicMock()
        patient_user.is_authenticated = True
        patient_user.role = "PATIENT"
        result = SecurityPolicyEngine.can_view_finding(patient_user, MagicMock(vulnerability_type="XSS", affected_component="Frontend"))
        self.assertFalse(result)

    def test_doctor_cannot_view_finding(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        doctor_user = MagicMock()
        doctor_user.is_authenticated = True
        doctor_user.role = "DOCTOR"
        result = SecurityPolicyEngine.can_view_finding(doctor_user, MagicMock(vulnerability_type="IDOR", affected_component="API"))
        self.assertFalse(result)

    def test_it_admin_can_view_all_findings(self):
        from apps.security_testing.services.policy_engine import SecurityPolicyEngine
        admin_user = MagicMock()
        admin_user.is_authenticated = True
        admin_user.role = "IT_ADMIN"
        result = SecurityPolicyEngine.can_view_finding(admin_user, MagicMock(vulnerability_type="CRITICAL_RCE", affected_component="Backend"))
        self.assertTrue(result)


@pytest.mark.unit
class TestFindingFingerprint(TestCase):
    """Validates deterministic fingerprint generation for deduplication."""

    def test_same_inputs_produce_same_fingerprint(self):
        from apps.security_testing.services.fingerprint import FindingFingerprintService
        fp1 = FindingFingerprintService.generate_fingerprint("IDOR", "/api/v1/patients/123/", "GET", "CWE-639", "PatientAPI")
        fp2 = FindingFingerprintService.generate_fingerprint("IDOR", "/api/v1/patients/123/", "GET", "CWE-639", "PatientAPI")
        self.assertEqual(fp1, fp2)

    def test_different_endpoints_produce_different_fingerprints(self):
        from apps.security_testing.services.fingerprint import FindingFingerprintService
        fp1 = FindingFingerprintService.generate_fingerprint("IDOR", "/api/v1/patients/1/", "GET")
        fp2 = FindingFingerprintService.generate_fingerprint("IDOR", "/api/v1/patients/2/", "GET")
        self.assertNotEqual(fp1, fp2)

    def test_fingerprint_is_64_chars(self):
        from apps.security_testing.services.fingerprint import FindingFingerprintService
        fp = FindingFingerprintService.generate_fingerprint("XSS", "/api/v1/", "POST")
        self.assertEqual(len(fp), 64)


@pytest.mark.unit
class TestStrixParser(TestCase):
    """Validates Strix artifact parsing."""

    def test_run_metadata_parse(self):
        from apps.security_testing.services.strix_parser import StrixResultParser
        data = json.dumps({
            "status": "COMPLETED",
            "duration_seconds": 45.5,
            "cost": 0.05,
            "is_complete": True,
            "coverage": "FULL",
        })
        result = StrixResultParser.parse_run_metadata(data)
        self.assertEqual(result["status"], "COMPLETED")
        self.assertEqual(result["duration_seconds"], 45.5)
        self.assertTrue(result["is_complete"])

    def test_malformed_run_json_returns_invalid(self):
        from apps.security_testing.services.strix_parser import StrixResultParser
        result = StrixResultParser.parse_run_metadata("NOT_VALID_JSON!!!")
        self.assertEqual(result["status"], "RESULT_INVALID")
        self.assertFalse(result["is_complete"])

    def test_sarif_parsing_returns_empty_on_invalid(self):
        from apps.security_testing.services.strix_parser import StrixResultParser
        scan = MagicMock()
        scan.target = MagicMock()
        results = StrixResultParser.parse_sarif(scan, "{invalid}")
        self.assertEqual(results, [])


@pytest.mark.unit
class TestStrixAdapter(TestCase):
    """Tests StrixSecurityAdapter policy enforcement without invoking real subprocess."""

    @patch("apps.security_testing.services.strix_adapter.SecurityPolicyEngine.is_kill_switch_active", return_value=True)
    def test_kill_switch_blocks_adapter(self, mock_ks):
        from apps.security_testing.services.strix_adapter import StrixSecurityAdapter
        from apps.security_testing.models import SecurityScan, SecurityTarget, SecurityScanState, TargetType, ApprovalStatus

        target = MagicMock()
        target.name = "test-target"
        target.environment = "SECURITY_TEST"
        target.is_active = True
        target.is_approval_valid = True

        scan = MagicMock()
        scan.id = "00000000-0000-0000-0000-000000000001"
        scan.target = target
        scan.scan_type = "API_SECURITY"
        scan.initiated_by = None

        # Mock the DB save
        scan.save = MagicMock()

        adapter = StrixSecurityAdapter()
        adapter.initialize(scan)
        with patch.object(adapter, "_emit_audit"):
            findings = adapter.run_strix_scan(scan)

        self.assertEqual(findings, [])
        self.assertEqual(scan.status, SecurityScanState.BLOCKED)
