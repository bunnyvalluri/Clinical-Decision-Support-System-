"""
Unit tests for GitLab Integration Services & Webhooks.
"""
import pytest
from integrations.gitlab.client import GitLabClient
from integrations.gitlab.service import GitLabWebhookService, GitLabDeploymentService
from integrations.gitlab.exceptions import GitLabSignatureError, GitLabException


class TestGitLabWebhookVerification:
    def test_verify_token_success(self, settings):
        settings.GITLAB_WEBHOOK_SECRET_TOKEN = "test-secret-token-12345"
        assert GitLabWebhookService.verify_token("test-secret-token-12345") is True

    def test_verify_token_mismatch(self, settings):
        settings.GITLAB_WEBHOOK_SECRET_TOKEN = "test-secret-token-12345"
        assert GitLabWebhookService.verify_token("wrong-token") is False

    def test_verify_token_missing(self, settings):
        settings.GITLAB_WEBHOOK_SECRET_TOKEN = "test-secret-token-12345"
        assert GitLabWebhookService.verify_token(None) is False
        assert GitLabWebhookService.verify_token("") is False

    def test_process_event_valid(self, settings):
        settings.GITLAB_WEBHOOK_SECRET_TOKEN = "test-secret-token-12345"
        payload = {
            "object_kind": "pipeline",
            "object_attributes": {
                "status": "success",
                "ref": "main",
                "sha": "a1b2c3d4e5f6",
            },
            "project": {"id": 42},
        }
        res = GitLabWebhookService.process_event("test-secret-token-12345", payload)
        assert res["object_kind"] == "pipeline"
        assert res["status"] == "success"
        assert res["ref"] == "main"
        assert res["sha"] == "a1b2c3d4e5f6"
        assert res["project_id"] == 42

    def test_process_event_invalid_token_raises(self, settings):
        settings.GITLAB_WEBHOOK_SECRET_TOKEN = "test-secret-token-12345"
        with pytest.raises(GitLabSignatureError):
            GitLabWebhookService.process_event("invalid-token", {})


class TestGitLabClientAndCircuitBreaker:
    def test_client_circuit_breaker_trips(self, monkeypatch):
        client = GitLabClient(base_url="http://mock-invalid-gitlab.local")

        # Simulate failures
        client._record_failure()
        client._record_failure()
        client._record_failure()

        assert client._is_circuit_open is True

        with pytest.raises(GitLabException, match="circuit breaker is active"):
            client.get_pipeline("123", 1)

    def test_deployment_service_record_event(self):
        res = GitLabDeploymentService.record_deployment_event(
            environment="production",
            status="healthy",
            commit_sha="abcdef123456",
        )
        assert res["environment"] == "production"
        assert res["status"] == "healthy"
        assert res["recorded"] == "true"
