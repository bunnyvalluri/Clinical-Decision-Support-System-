"""
Unit and Integration Tests for Prompt 59 Clean Architecture Deployment Layer:
- ContainerRegistryClient
- HealthCheckService
- DeploymentService
- DeploymentRollbackService
- DeploymentAuditService
"""

import uuid
from unittest.mock import MagicMock, patch
import pytest
from django.contrib.auth import get_user_model

from apps.core.models import AuditLog
from apps.infrastructure.models import DeploymentApplication, DeploymentRecord
from integrations.deployment import (
    ContainerRegistryClient,
    ContainerRegistryError,
    CoolifyClient,
    DeploymentAuditService,
    DeploymentRollbackService,
    DeploymentService,
    HealthCheckService,
)

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="admin_deploy_test",
        email="admin_deploy@healthnova.test",
        password="TestPassword123!",
        role="ADMIN",
        is_staff=True,
        is_active=True,
    )


# -----------------------------------------------------------------------------
# 1. ContainerRegistryClient Tests
# -----------------------------------------------------------------------------
def test_container_registry_tag_validation():
    client = ContainerRegistryClient()

    # Reject mutable floating tags
    assert not client.validate_image_tag("latest")
    assert not client.validate_image_tag("LATEST")
    assert not client.validate_image_tag("dev")
    assert not client.validate_image_tag("current")
    assert not client.validate_image_tag("")

    # Accept immutable commit SHAs
    assert client.validate_image_tag("a1b2c3d")
    assert client.validate_image_tag("499ac955aaeb4c47add4d0b14098737a12345678")

    # Accept semantic release tags
    assert client.validate_image_tag("v1.0.0")
    assert client.validate_image_tag("v2.4.1-rc1")
    assert client.validate_image_tag("1.2.3")


def test_container_registry_manifest_rejection_on_invalid_tag():
    client = ContainerRegistryClient(registry_url="https://ghcr.io", auth_token="mock_token")
    with pytest.raises(ContainerRegistryError) as exc:
        client.get_image_manifest("healthnova/backend", "latest")
    assert "Invalid or unsafe image tag" in str(exc.value)


@patch("requests.get")
def test_container_registry_manifest_success(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.headers = {
        "Docker-Content-Digest": "sha256:abcd1234ef567890",
        "content-type": "application/json",
    }
    mock_resp.json.return_value = {"schemaVersion": 2}
    mock_get.return_value = mock_resp

    client = ContainerRegistryClient(registry_url="https://ghcr.io", auth_token="mock_token")
    res = client.get_image_manifest("healthnova/backend", "a1b2c3d")
    assert res["status"] == "VERIFIED"
    assert res["digest"] == "sha256:abcd1234ef567890"


# -----------------------------------------------------------------------------
# 2. HealthCheckService Tests
# -----------------------------------------------------------------------------
@pytest.mark.django_db
def test_health_check_service_database():
    service = HealthCheckService()
    res = service.check_database()
    assert res["component"] == "Neon PostgreSQL"
    assert res["status"] == "HEALTHY"
    assert res["latency_ms"] >= 0


@patch("requests.get")
def test_health_check_service_frontend(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.headers = {"content-type": "application/json"}
    mock_resp.json.return_value = {"status": "healthy", "service": "healthnova-frontend"}
    mock_get.return_value = mock_resp

    service = HealthCheckService()
    res = service.check_frontend("http://localhost:3000")
    assert res["status"] == "HEALTHY"
    assert res["component"] == "Next.js Frontend"


@patch("requests.get")
def test_health_check_service_meilisearch(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_get.return_value = mock_resp

    service = HealthCheckService()
    res = service.check_meilisearch("http://localhost:7700")
    assert res["status"] == "HEALTHY"
    assert res["component"] == "Meilisearch"


@patch("requests.get")
def test_health_check_service_ollama_graceful_degraded(mock_get):
    mock_get.side_effect = Exception("Connection refused")
    service = HealthCheckService()
    res = service.check_ollama("http://localhost:11434")
    assert res["status"] == "DEGRADED"
    assert res["component"] == "Ollama LLM"


# -----------------------------------------------------------------------------
# 3. DeploymentService Tests
# -----------------------------------------------------------------------------
@pytest.mark.django_db
def test_deployment_service_rejects_mutable_tag(admin_user):
    service = DeploymentService()
    with pytest.raises(ValueError) as exc:
        service.deploy(
            application_id="app-be-prod",
            commit_sha="latest",
            actor=admin_user,
        )
    assert "Unsafe image tag" in str(exc.value)


@pytest.mark.django_db
def test_deployment_service_success_with_lineage(admin_user):
    app = DeploymentApplication.objects.create(
        coolify_resource_id="app-backend-001",
        name="HealthNova Backend",
        environment="PRODUCTION",
    )

    with patch.object(CoolifyClient, "deploy_application") as mock_coolify_deploy:
        mock_coolify_deploy.return_value = {"deployment_id": "coolify-dep-8888"}

        service = DeploymentService()
        result = service.deploy(
            application_id="app-backend-001",
            commit_sha="a1b2c3d4e5f6",
            actor=admin_user,
            image_digest="sha256:digest123456",
            frontend_version="1.0.0",
            backend_version="1.0.0",
            model_version="sepsis_rf_v2.1",
            dataset_version="kaggle_stroke_2026",
            reason="Production Release 1.0",
        )

        assert result["success"] is True
        assert result["deployment_id"] == "coolify-dep-8888"
        assert result["status"] == "QUEUED"

        # Verify database record lineage
        record = DeploymentRecord.objects.get(id=result["record_id"])
        assert record.commit_sha == "a1b2c3d4e5f6"
        assert record.image_digest == "sha256:digest123456"
        assert record.model_version == "sepsis_rf_v2.1"
        assert record.dataset_version == "kaggle_stroke_2026"
        assert record.actor == admin_user

        # Verify immutable audit log
        audit = AuditLog.objects.filter(resource_id=str(record.id)).first()
        assert audit is not None
        assert "sepsis_rf_v2.1" in audit.description


# -----------------------------------------------------------------------------
# 4. DeploymentRollbackService Tests
# -----------------------------------------------------------------------------
@pytest.mark.django_db
def test_rollback_requires_strict_confirmation(admin_user):
    service = DeploymentRollbackService()
    with pytest.raises(ValueError) as exc:
        service.rollback(
            application_id="app-backend-001",
            target_commit_sha="prev1234",
            actor=admin_user,
            confirmation="invalid_confirmation",
        )
    assert "confirmation='CONFIRM_ROLLBACK'" in str(exc.value)


@pytest.mark.django_db
def test_rollback_success(admin_user):
    app = DeploymentApplication.objects.create(
        coolify_resource_id="app-backend-001",
        name="HealthNova Backend",
        environment="PRODUCTION",
    )

    with patch.object(CoolifyClient, "deploy_application") as mock_coolify_deploy:
        mock_coolify_deploy.return_value = {"deployment_id": "rollback-dep-7777"}

        service = DeploymentRollbackService()
        result = service.rollback(
            application_id="app-backend-001",
            target_commit_sha="previous9876",
            actor=admin_user,
            confirmation="CONFIRM_ROLLBACK",
            reason="Critical incident remediation",
        )

        assert result["success"] is True
        assert result["deployment_id"] == "rollback-dep-7777"
        assert result["status"] == "QUEUED"

        record = DeploymentRecord.objects.get(id=result["record_id"])
        assert record.trigger == "ROLLBACK"
        assert record.commit_sha == "previous9876"
        assert record.metadata["rollback"] is True
