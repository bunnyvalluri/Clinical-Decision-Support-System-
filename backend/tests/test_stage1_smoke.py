"""
Stage 1 smoke tests — verify the application boots and core infrastructure works.
"""
import pytest
from django.test import TestCase


@pytest.mark.django_db
class TestHealthCheck:
    """Test the /api/v1/health/ endpoint."""

    def test_health_endpoint_returns_200(self, api_client):
        response = api_client.get("/api/v1/health/")
        assert response.status_code == 200

    def test_health_response_structure(self, api_client):
        response = api_client.get("/api/v1/health/")
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert data["data"]["status"] in ("healthy", "degraded")
        assert "services" in data["data"]
        assert "database" in data["data"]["services"]


@pytest.mark.django_db
class TestUserModel:
    """Test the custom User model and roles."""

    def test_user_creation(self, doctor_user):
        assert doctor_user.email == "doctor@test.local"
        assert doctor_user.role == "DOCTOR"
        assert doctor_user.is_active is True

    def test_user_role_properties(self, doctor_user, admin_user, nurse_user, analyst_user):
        assert doctor_user.is_doctor is True
        assert doctor_user.is_admin is False
        assert admin_user.is_admin is True
        assert nurse_user.is_nurse is True
        assert analyst_user.is_analyst is True

    def test_user_str_representation(self, doctor_user):
        str_repr = str(doctor_user)
        assert "doctor@test.local" in str_repr
        assert "DOCTOR" in str_repr

    def test_user_uuid_primary_key(self, doctor_user):
        import uuid
        assert isinstance(doctor_user.id, uuid.UUID)

    def test_username_field_is_email(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        assert User.USERNAME_FIELD == "email"

    def test_admin_user_is_staff(self, admin_user):
        assert admin_user.is_staff is True


@pytest.mark.django_db
class TestAuditLog:
    """Test the AuditLog model."""

    def test_audit_log_creation(self, doctor_user):
        from apps.core.models import AuditLog
        log = AuditLog.objects.create(
            user=doctor_user,
            action=AuditLog.Action.LOGIN,
            resource_type="User",
            resource_id=str(doctor_user.id),
            description="Test login audit log",
        )
        assert log.pk is not None
        assert log.action == "LOGIN"
        assert log.resource_type == "User"

    def test_audit_log_str(self, doctor_user):
        from apps.core.models import AuditLog
        log = AuditLog.objects.create(
            user=doctor_user,
            action=AuditLog.Action.CREATE,
            resource_type="Patient",
            resource_id="test-123",
        )
        assert "CREATE" in str(log)
        assert "Patient" in str(log)


@pytest.mark.django_db
class TestBaseModel:
    """Test BaseModel abstract fields are applied to concrete models."""

    def test_mlmodel_has_uuid_id(self):
        import uuid
        from apps.ml_engine.models import MLModel
        from apps.accounts.models import User
        # MLModel inherits from BaseModel
        assert MLModel._meta.get_field("id").primary_key is True

    def test_mlmodel_has_timestamps(self):
        from apps.ml_engine.models import MLModel
        field_names = [f.name for f in MLModel._meta.get_fields()]
        assert "created_at" in field_names
        assert "updated_at" in field_names
