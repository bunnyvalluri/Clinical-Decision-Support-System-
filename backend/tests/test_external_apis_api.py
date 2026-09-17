"""
Integration tests for External APIs DRF Endpoints:
- GET /api/v1/external-apis/registry/
- GET /api/v1/external-apis/circuit-breaker/
- POST /api/v1/external-apis/circuit-breaker/ (Reset)
- GET /api/v1/external-apis/health/
- Role authorization boundaries
"""
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from apps.external_apis.models import ExternalAPIRegistry, APIStatus


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        username="admin_ext_api_test",
        email="admin.ext@hospital.org",
        password="SecureAdminPassword123!",
        role=UserRole.ADMIN,
        first_name="Admin",
        last_name="User",
        is_staff=True,
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username="doc_ext_api_test",
        email="doc.ext@hospital.org",
        password="SecureDocPassword123!",
        role=UserRole.CLINICIAN,
        first_name="Gregory",
        last_name="House",
    )


@pytest.mark.django_db
class TestExternalAPIEndpoints:
    """Test REST API endpoints for External APIs."""

    def test_unauthenticated_request_rejected(self):
        client = APIClient()
        resp = client.get("/api/v1/external-apis/registry/")
        assert resp.status_code == 401

    def test_doctor_can_view_registry(self, doctor_user):
        client = APIClient()
        client.force_authenticate(user=doctor_user)
        resp = client.get("/api/v1/external-apis/registry/")
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert data["count"] >= 4

    def test_doctor_can_inspect_circuit_breaker(self, doctor_user):
        client = APIClient()
        client.force_authenticate(user=doctor_user)
        resp = client.get("/api/v1/external-apis/circuit-breaker/")
        assert resp.status_code == 200
        data = resp.json()
        assert "circuit_states" in data
        assert "openFDA" in data["circuit_states"]

    def test_admin_can_reset_circuit_breaker(self, admin_user):
        client = APIClient()
        client.force_authenticate(user=admin_user)
        resp = client.post("/api/v1/external-apis/circuit-breaker/", {"provider": "openFDA"})
        assert resp.status_code == 200
        assert "reset to CLOSED" in resp.json().get("detail", "")

    def test_doctor_forbidden_from_resetting_circuit_breaker(self, doctor_user):
        client = APIClient()
        client.force_authenticate(user=doctor_user)
        resp = client.post("/api/v1/external-apis/circuit-breaker/", {"provider": "openFDA"})
        assert resp.status_code == 403
