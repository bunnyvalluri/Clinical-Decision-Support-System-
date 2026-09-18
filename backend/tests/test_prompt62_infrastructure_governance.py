"""
Hermetic & Fast Unit Test Suite for Prompt 62 — Platform Engineering, IaC, Cloud Hardening & Governance.
Runs completely offline in < 2 seconds without external cloud calls or database locking.
"""

from unittest.mock import MagicMock, patch
import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.accounts.models import UserRole
from apps.infrastructure.models import (
    IaCPlanRecord,
    InfrastructureDriftRecord,
    InfrastructurePolicyCheck,
)
from apps.infrastructure.views import (
    IaCPlanView,
    IaCApplyView,
    DriftDetectionView,
    InfrastructurePolicyView,
    CostGovernanceView,
    InfrastructureTopologyView,
)
from integrations.infrastructure import (
    OpenTofuIaCService,
    IaCExecutionError,
    DriftDetectionService,
    PolicyEvaluationService,
    CostGovernanceService,
)


@pytest.fixture
def it_admin():
    user = MagicMock()
    user.is_authenticated = True
    user.username = "sre_platform_lead"
    user.role = UserRole.IT_ADMIN
    user.is_admin = True
    return user


@pytest.fixture
def doctor_user():
    user = MagicMock()
    user.is_authenticated = True
    user.username = "dr_stephen"
    user.role = UserRole.DOCTOR
    user.is_admin = False
    return user


@pytest.fixture
def informaticist_user():
    user = MagicMock()
    user.is_authenticated = True
    user.username = "informaticist_anna"
    user.role = UserRole.MEDICAL_INFORMATICIST
    user.is_admin = False
    return user


@pytest.fixture
def rf():
    return APIRequestFactory()


# -----------------------------------------------------------------------------
# 1. OpenTofu Speculative Planning
# -----------------------------------------------------------------------------
def test_iac_plan_generation_speculative_preview():
    service = OpenTofuIaCService()
    result = service.plan("production")

    assert result["environment"] == "production"
    assert result["status"] == "PLANNED"
    assert result["requires_human_approval"] is True
    assert "correlation_id" in result
    assert result["resources_to_add"] >= 0


# -----------------------------------------------------------------------------
# 2. Production Apply Approval Gate Enforcement
# -----------------------------------------------------------------------------
def test_production_apply_requires_human_approval():
    service = OpenTofuIaCService()
    with pytest.raises(IaCExecutionError) as exc_info:
        service.apply("production", approval_token=None)

    assert "CRITICAL GOVERNANCE REJECTION" in str(exc_info.value)


def test_production_apply_succeeds_with_approval():
    service = OpenTofuIaCService()
    result = service.apply("production", approval_token="VALID-TOKEN-SRE-2026")

    assert result["environment"] == "production"
    assert result["status"] == "APPLIED"
    assert result["approved"] is True


# -----------------------------------------------------------------------------
# 3. Drift Detection & Remediation
# -----------------------------------------------------------------------------
def test_drift_detection_in_sync():
    service = DriftDetectionService()
    result = service.check_environment_drift("production")

    assert result["environment"] == "production"
    assert result["is_drifted"] is False
    assert result["status"] == "IN_SYNC"
    assert result["remediation_plan"] is None


def test_drift_detection_drifted_generates_remediation():
    mock_iac = MagicMock()
    mock_iac.detect_drift.return_value = {
        "correlation_id": "test-uuid",
        "environment": "production",
        "is_drifted": True,
        "exit_code": 2,
        "status": "DRIFT_DETECTED",
        "summary": "Security group modified out of band.",
        "timestamp": "2026-09-18T20:00:00Z",
    }

    service = DriftDetectionService(iac_service=mock_iac)
    result = service.check_environment_drift("production")

    assert result["is_drifted"] is True
    assert result["status"] == "DRIFT_DETECTED"
    assert result["exit_code"] == 2
    assert "Review plan differences" in result["remediation_plan"]


# -----------------------------------------------------------------------------
# 4. Policy Guardrails (HIPAA & CIS Benchmarks)
# -----------------------------------------------------------------------------
def test_policy_evaluation_all_checks():
    service = PolicyEvaluationService()
    checks = service.run_all_checks()

    assert len(checks) >= 5
    policy_names = [c["policy_name"] for c in checks]
    assert any("Strict Ingress Port Isolation" in name for name in policy_names)
    assert any("Object Storage At-Rest Encryption" in name for name in policy_names)
    assert any("Host IMDSv2 & EBS Disk Encryption" in name for name in policy_names)
    assert any("Mandatory In-Transit Encryption" in name for name in policy_names)
    assert any("Remote State Concurrency Locking" in name for name in policy_names)

    for c in checks:
        assert c["status"] in ("PASSED", "WARNING", "FAILED")


# -----------------------------------------------------------------------------
# 5. FinOps Cost Governance Zero Fake Data Invariant
# -----------------------------------------------------------------------------
def test_cost_governance_zero_fake_data_policy():
    with patch.dict("os.environ", {}, clear=True):
        service = CostGovernanceService()
        cost_summary = service.get_cost_summary("production")

        assert cost_summary["status"] == "UNAVAILABLE"
        assert cost_summary["available"] is False
        assert "Cost data unavailable" in cost_summary["message"]
        assert cost_summary["monthly_estimated_total"] is None


# -----------------------------------------------------------------------------
# 6. Authoritative Multi-Tier Topology View
# -----------------------------------------------------------------------------
def test_infrastructure_topology_metadata(rf, it_admin):
    view = InfrastructureTopologyView.as_view()
    request = rf.get("/api/v1/infrastructure/topology/")
    force_authenticate(request, user=it_admin)

    response = view(request)
    assert response.status_code == 200
    data = response.data

    assert data["vpc"]["cidr"] == "10.0.0.0/16"
    assert len(data["subnets"]) == 6
    assert data["database"]["engine"] == "Neon PostgreSQL Serverless"
    assert data["database"]["branch"] == "production"
    assert data["database"]["authoritative"] is True
    assert data["storage"]["encryption"] == "SSE-S3 (AES256)"


# -----------------------------------------------------------------------------
# 7. Role-Based Access Control (RBAC) Isolation
# -----------------------------------------------------------------------------
def test_rbac_doctor_forbidden(rf, doctor_user):
    view = IaCPlanView.as_view()
    request = rf.get("/api/v1/infrastructure/iac/plans/")
    force_authenticate(request, user=doctor_user)

    response = view(request)
    assert response.status_code == 403


def test_rbac_informaticist_read_only(rf, informaticist_user):
    # GET is permitted (safe method)
    view = IaCPlanView.as_view()
    get_req = rf.get("/api/v1/infrastructure/iac/plans/")
    force_authenticate(get_req, user=informaticist_user)
    with patch.object(IaCPlanRecord.objects, "all", return_value=[]):
        get_res = view(get_req)
        assert get_res.status_code == 200

    # POST is strictly forbidden (mutating method)
    post_req = rf.post("/api/v1/infrastructure/iac/plans/", {"environment": "staging"}, format="json")
    force_authenticate(post_req, user=informaticist_user)
    post_res = view(post_req)
    assert post_res.status_code == 403


def test_rbac_it_admin_full_access(rf, it_admin):
    view = IaCPlanView.as_view()
    get_req = rf.get("/api/v1/infrastructure/iac/plans/")
    force_authenticate(get_req, user=it_admin)
    with patch.object(IaCPlanRecord.objects, "all", return_value=[]):
        get_res = view(get_req)
        assert get_res.status_code == 200



# -----------------------------------------------------------------------------
# 8. OpenTofu Production HCL Declaration Integrity
# -----------------------------------------------------------------------------
def test_opentofu_hcl_declaration_integrity():
    from pathlib import Path
    from django.conf import settings

    base_dir = Path(settings.BASE_DIR).parent / "infra"
    prod_tf = base_dir / "environments" / "production" / "main.tf"
    assert prod_tf.exists()

    content = prod_tf.read_text(encoding="utf-8")
    assert 'backend "s3"' in content
    assert 'dynamodb_table = "healthnova-production-tofu-locks"' in content
    assert 'module "networking"' in content
    assert 'module "firewall"' in content
    assert 'module "storage_backups"' in content
    assert 'module "server"' in content
