"""
Tests for Stage 2 Authentication & User Management.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestAuthentication:
    """Test suite for user registration, JWT login, token rotation, and logout."""

    def test_user_registration_success(self, api_client):
        payload = {
            "email": "new.doctor@clinical-ai.local",
            "username": "new_doc",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "first_name": "New",
            "last_name": "Doctor",
            "role": "DOCTOR",
            "department": "Pediatrics",
            "phone_number": "+1-555-9999",
        }
        response = api_client.post("/api/v1/auth/register/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert "tokens" in response.data["data"]
        assert "access" in response.data["data"]["tokens"]
        assert "refresh" in response.data["data"]["tokens"]
        assert response.data["data"]["user"]["email"] == "new.doctor@clinical-ai.local"

    def test_registration_password_mismatch(self, api_client):
        payload = {
            "email": "mismatch@clinical-ai.local",
            "username": "mismatch",
            "password": "StrongPassword123!",
            "password_confirm": "DifferentPassword123!",
            "first_name": "Test",
            "last_name": "Mismatch",
        }
        response = api_client.post("/api/v1/auth/register/", payload, format="json")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert response.data["success"] is False
        assert response.data["error"]["code"] == "validation_error"

    def test_registration_duplicate_email(self, api_client, doctor_user):
        payload = {
            "email": doctor_user.email,
            "username": "duplicate_user",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "first_name": "Duplicate",
            "last_name": "User",
        }
        response = api_client.post("/api/v1/auth/register/", payload, format="json")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert response.data["success"] is False
        assert response.data["error"]["code"] == "validation_error"

    def test_login_success(self, api_client, doctor_user):
        payload = {
            "email": doctor_user.email,
            "password": "DoctorPass123!",
        }
        response = api_client.post("/api/v1/auth/login/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        data = response.data["data"]
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["email"] == doctor_user.email
        assert data["user"]["role"] == "DOCTOR"

    def test_login_invalid_password(self, api_client, doctor_user):
        payload = {
            "email": doctor_user.email,
            "password": "WrongPassword!",
        }
        response = api_client.post("/api/v1/auth/login/", payload, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, doctor_user):
        # First login to get tokens
        login_res = api_client.post(
            "/api/v1/auth/login/",
            {"email": doctor_user.email, "password": "DoctorPass123!"},
            format="json",
        )
        refresh_token = login_res.data["data"]["refresh"]

        # Refresh the token
        refresh_res = api_client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        assert refresh_res.status_code == status.HTTP_200_OK
        assert "access" in refresh_res.data["data"]

    def test_logout_blacklists_token(self, api_client, doctor_user):
        login_res = api_client.post(
            "/api/v1/auth/login/",
            {"email": doctor_user.email, "password": "DoctorPass123!"},
            format="json",
        )
        access_token = login_res.data["data"]["access"]
        refresh_token = login_res.data["data"]["refresh"]

        # Logout with auth header and refresh token
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        logout_res = api_client.post(
            "/api/v1/auth/logout/",
            {"refresh": refresh_token},
            format="json",
        )
        assert logout_res.status_code == status.HTTP_200_OK

        # Verify refresh token is blacklisted and cannot be reused
        api_client.credentials()  # clear credentials
        re_refresh_res = api_client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        assert re_refresh_res.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserProfile:
    """Test suite for current user profile and password change."""

    def test_get_current_user_profile(self, api_client, doctor_user):
        api_client.force_authenticate(user=doctor_user)
        response = api_client.get("/api/v1/auth/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert response.data["data"]["email"] == doctor_user.email
        assert response.data["data"]["role"] == "DOCTOR"

    def test_update_current_user_profile(self, api_client, doctor_user):
        api_client.force_authenticate(user=doctor_user)
        payload = {
            "first_name": "UpdatedPriya",
            "last_name": "UpdatedSharma",
            "department": "Neurology",
            "phone_number": "+1-555-8888",
        }
        response = api_client.put("/api/v1/auth/me/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        doctor_user.refresh_from_db()
        assert doctor_user.first_name == "UpdatedPriya"
        assert doctor_user.department == "Neurology"

    def test_change_password(self, api_client, doctor_user):
        api_client.force_authenticate(user=doctor_user)
        payload = {
            "old_password": "DoctorPass123!",
            "new_password": "NewSecretPass456!",
            "new_password_confirm": "NewSecretPass456!",
        }
        response = api_client.post("/api/v1/auth/change-password/", payload, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Verify login works with new password
        api_client.force_authenticate(user=None)
        login_res = api_client.post(
            "/api/v1/auth/login/",
            {"email": doctor_user.email, "password": "NewSecretPass456!"},
            format="json",
        )
        assert login_res.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestRolePermissions:
    """Test suite for role-based access control (RBAC)."""

    def test_admin_can_access_user_list(self, admin_client):
        response = admin_client.get("/api/v1/auth/users/")
        assert response.status_code == status.HTTP_200_OK

    def test_doctor_cannot_access_user_management(self, authenticated_client):
        response = authenticated_client.get("/api/v1/auth/users/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_nurse_cannot_access_user_management(self, api_client, nurse_user):
        api_client.force_authenticate(user=nurse_user)
        response = api_client.get("/api/v1/auth/users/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
