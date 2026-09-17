"""
Test Suite for Prompt 36 — Coolify Infrastructure & Deployment Control Plane.

Verifies:
1. Version specification and license documentation.
2. Production and Staging Docker Compose manifests.
3. CoolifyClient circuit breaker and timeout resilience.
4. InfrastructureServer, DeploymentApplication, and DeploymentRecord models.
5. 5-Role RBAC boundary enforcement (IT Admin allowed, Doctor/Nurse/Patient 403 forbidden).
6. Controlled deployment triggers with correlation IDs and immutable audit logging.
7. Rollback endpoint requiring explicit human confirmation.
"""

import uuid
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.core.models import AuditLog
from apps.infrastructure.models import (
    InfrastructureServer,
    DeploymentApplication,
    DeploymentRecord,
)
from integrations.coolify.client import (
    CoolifyClient,
    CoolifyException,
    CoolifyCircuitBreakerOpenError,
)

User = get_user_model()
REPO_ROOT = Path(__file__).resolve().parent.parent.parent


# --------------------------------------------------------------------------
# FIXTURES
# --------------------------------------------------------------------------
@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="test_admin_infra",
        email="admin_infra@healthnova.test",
        password="TestPassword123!",
        role="ADMIN",
        is_staff=True,
        is_active=True,
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="test_doctor_infra",
        email="doctor_infra@healthnova.test",
        password="TestPassword123!",
        role="DOCTOR",
        is_active=True,
    )


@pytest.fixture
def nurse_user(db):
    return User.objects.create_user(
        username="test_nurse_infra",
        email="nurse_infra@healthnova.test",
        password="TestPassword123!",
        role="NURSE",
        is_active=True,
    )


@pytest.fixture
def patient_user(db):
    return User.objects.create_user(
        username="test_patient_infra",
        email="patient_infra@healthnova.test",
        password="TestPassword123!",
        role="PATIENT",
        is_active=True,
    )


@pytest.fixture
def informaticist_user(db):
    return User.objects.create_user(
        username="test_info_infra",
        email="info_infra@healthnova.test",
        password="TestPassword123!",
        role="INFORMATICIST",
        is_active=True,
    )


# --------------------------------------------------------------------------
# 1. SPECIFICATION & MANIFEST VERIFICATION
# --------------------------------------------------------------------------
def test_coolify_version_specification_pinned():
    """Ensure COOLIFY_VERSION.md pins a concrete release, avoiding floating tags."""
    version_file = REPO_ROOT / "docs" / "integrations" / "COOLIFY_VERSION.md"
    assert version_file.is_file()
    content = version_file.read_text(encoding="utf-8")
    assert "v4.0.0" in content
    assert "ghcr.io/coollabsio/coolify:" in content


def test_coolify_license_review_exists():
    """Ensure COOLIFY_LICENSE.md exists and documents Apache 2.0."""
    license_file = REPO_ROOT / "docs" / "integrations" / "COOLIFY_LICENSE.md"
    assert license_file.is_file()
    content = license_file.read_text(encoding="utf-8")
    assert "Apache License, Version 2.0" in content or "Apache 2.0" in content


def test_coolify_compose_manifests_exist():
    """Ensure production and staging Compose manifests are tracked."""
    prod_compose = REPO_ROOT / "infra" / "coolify" / "docker-compose.prod.yml"
    staging_compose = REPO_ROOT / "infra" / "coolify" / "docker-compose.staging.yml"
    assert prod_compose.is_file()
    assert staging_compose.is_file()

    prod_content = prod_compose.read_text(encoding="utf-8")
    assert "traefik.enable=true" in prod_content
    assert "healthcheck:" in prod_content


# --------------------------------------------------------------------------
# 2. CLIENT FAULT TOLERANCE & CIRCUIT BREAKER
# --------------------------------------------------------------------------
def test_coolify_client_unconfigured_behavior():
    """Unconfigured client should report is_configured=False and raise on request."""
    client = CoolifyClient(base_url="", api_token="")
    assert not client.is_configured
    with pytest.raises(CoolifyException):
        client.get_servers()


def test_coolify_client_circuit_breaker():
    """Successive connection failures should trip circuit breaker into OPEN state."""
    client = CoolifyClient(base_url="http://127.0.0.1:9999/api/v1", api_token="dummy_token", timeout=1)
    client._max_failures = 2

    # Simulate failures
    with pytest.raises(CoolifyException):
        client._request("GET", "/servers")
    with pytest.raises(CoolifyException):
        client._request("GET", "/servers")

    assert client._is_circuit_open

    # Next call should immediately raise CircuitBreakerOpenError without attempting network request
    with pytest.raises(CoolifyCircuitBreakerOpenError):
        client._request("GET", "/servers")


# --------------------------------------------------------------------------
# 3. INFRASTRUCTURE ORM MODELS
# --------------------------------------------------------------------------
@pytest.mark.django_db
def test_infrastructure_server_model_no_ssh_leak():
    """Verify server model persists host metadata with no private key fields."""
    server = InfrastructureServer.objects.create(
        coolify_server_id="srv-node-01",
        name="Production Host Alpha",
        environment="PRODUCTION",
        status="HEALTHY",
        region="us-east-2",
        provider="Dedicated VM",
    )
    assert server.name == "Production Host Alpha"
    assert not hasattr(server, "ssh_private_key")
    assert not hasattr(server, "private_key")


@pytest.mark.django_db
def test_deployment_record_correlation_id(admin_user):
    """Verify DeploymentRecord generates valid correlation ID and tracks state."""
    app = DeploymentApplication.objects.create(
        coolify_resource_id="app-be-001",
        name="HealthNova Backend API",
        branch="main",
    )
    corr_id = uuid.uuid4()
    record = DeploymentRecord.objects.create(
        coolify_deployment_id="dep-12345",
        application=app,
        commit_sha="a1b2c3d4e5f6a7b8c9d0",
        status=DeploymentRecord.Status.QUEUED,
        actor=admin_user,
        correlation_id=corr_id,
    )
    assert record.status == "QUEUED"
    assert record.correlation_id == corr_id
    assert record.application.name == "HealthNova Backend API"


# --------------------------------------------------------------------------
# 4. REST API 5-ROLE RBAC ENFORCEMENT
# --------------------------------------------------------------------------
@pytest.mark.django_db
def test_infrastructure_health_it_admin_allowed(api_client, admin_user):
    """IT Administrator can access infrastructure health."""
    api_client.force_authenticate(user=admin_user)
    res = api_client.get("/api/v1/infrastructure/health/")
    assert res.status_code == 200
    data = res.json()
    assert "health" in data


@pytest.mark.django_db
def test_infrastructure_health_informaticist_read_only(api_client, informaticist_user):
    """Informaticist can view read-only infrastructure telemetry."""
    api_client.force_authenticate(user=informaticist_user)
    res = api_client.get("/api/v1/infrastructure/health/")
    assert res.status_code == 200


@pytest.mark.django_db
def test_infrastructure_health_doctor_forbidden(api_client, doctor_user):
    """Doctor is strictly forbidden from accessing infrastructure health."""
    api_client.force_authenticate(user=doctor_user)
    res = api_client.get("/api/v1/infrastructure/health/")
    assert res.status_code == 403


@pytest.mark.django_db
def test_infrastructure_deploy_doctor_forbidden(api_client, doctor_user):
    """Doctor cannot trigger application deployments."""
    api_client.force_authenticate(user=doctor_user)
    res = api_client.post("/api/v1/infrastructure/deploy/", {"application_id": "app-test"}, format="json")
    assert res.status_code == 403


@pytest.mark.django_db
def test_infrastructure_deploy_nurse_forbidden(api_client, nurse_user):
    """Nurse cannot trigger application deployments."""
    api_client.force_authenticate(user=nurse_user)
    res = api_client.post("/api/v1/infrastructure/deploy/", {"application_id": "app-test"}, format="json")
    assert res.status_code == 403


@pytest.mark.django_db
def test_infrastructure_deploy_patient_forbidden(api_client, patient_user):
    """Patient cannot trigger application deployments."""
    api_client.force_authenticate(user=patient_user)
    res = api_client.post("/api/v1/infrastructure/deploy/", {"application_id": "app-test"}, format="json")
    assert res.status_code == 403


@pytest.mark.django_db
def test_infrastructure_deploy_it_admin_authorized(api_client, admin_user):
    """IT Administrator can trigger deployment and creates audit log."""
    api_client.force_authenticate(user=admin_user)
    with patch("integrations.coolify.service.CoolifyClient.deploy_application") as mock_deploy:
        mock_deploy.return_value = {"deployment_id": "dep-mock-999"}
        res = api_client.post(
            "/api/v1/infrastructure/deploy/",
            {"application_id": "app-backend-001", "commit_sha": "abc1234"},
            format="json",
        )
        assert res.status_code == 202
        data = res.json()
        assert data["success"] is True
        assert "correlation_id" in data

        # Verify audit log was created
        audit = AuditLog.objects.filter(resource_type="DeploymentRecord").first()
        assert audit is not None
        assert "app-backend-001" in audit.description


@pytest.mark.django_db
def test_infrastructure_rollback_requires_confirmation(api_client, admin_user):
    """Rollback requires explicit CONFIRM_ROLLBACK string in payload."""
    api_client.force_authenticate(user=admin_user)
    res = api_client.post(
        "/api/v1/infrastructure/rollback/",
        {"application_id": "app-backend-001", "target_commit_sha": "abc1234"},
        format="json",
    )
    assert res.status_code == 400
    assert "confirmation='CONFIRM_ROLLBACK'" in res.json().get("error", "")
