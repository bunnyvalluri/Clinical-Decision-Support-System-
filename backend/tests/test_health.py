"""
Tests for system health endpoints (liveness and readiness).
"""
import pytest
from rest_framework import status


@pytest.mark.django_db
class TestHealthEndpoints:
    """Test suite for system health endpoints."""

    def test_liveness_check(self, api_client):
        """GET /api/v1/health/ returns 200 and healthy status."""
        response = api_client.get("/api/v1/health/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert response.data["data"]["status"] == "healthy"
        assert response.data["data"]["version"] == "1.0.0"

    def test_readiness_check(self, api_client):
        """GET /api/v1/health/ready/ verifies PostgreSQL and Redis dependencies."""
        response = api_client.get("/api/v1/health/ready/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        data = response.data["data"]
        assert data["status"] == "ready"
        assert "database" in data["dependencies"]
        assert data["dependencies"]["database"]["status"] == "ok"
        assert "redis" in data["dependencies"]
        assert data["dependencies"]["redis"]["status"] == "ok"
