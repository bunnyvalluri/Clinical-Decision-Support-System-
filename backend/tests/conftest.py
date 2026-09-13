"""
Shared pytest fixtures for the test suite.

Fixtures here are available to all tests without explicit import.
Domain-specific fixtures live in their respective test module conftest.py files.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client() -> APIClient:
    """Return an unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create and return an ADMIN role user."""
    return User.objects.create_user(
        username="admin_test",
        email="admin@test.local",
        password="AdminPass123!",
        first_name="Admin",
        last_name="User",
        role="ADMIN",
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def doctor_user(db):
    """Create and return a DOCTOR role user."""
    return User.objects.create_user(
        username="doctor_test",
        email="doctor@test.local",
        password="DoctorPass123!",
        first_name="Doctor",
        last_name="User",
        role="DOCTOR",
    )


@pytest.fixture
def nurse_user(db):
    """Create and return a NURSE role user."""
    return User.objects.create_user(
        username="nurse_test",
        email="nurse@test.local",
        password="NursePass123!",
        first_name="Nurse",
        last_name="User",
        role="NURSE",
    )


@pytest.fixture
def analyst_user(db):
    """Create and return an ANALYST role user."""
    return User.objects.create_user(
        username="analyst_test",
        email="analyst@test.local",
        password="AnalystPass123!",
        first_name="Analyst",
        last_name="User",
        role="ANALYST",
    )


@pytest.fixture
def authenticated_client(api_client, doctor_user) -> APIClient:
    """Return a DRF test client authenticated as a doctor."""
    api_client.force_authenticate(user=doctor_user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user) -> APIClient:
    """Return a DRF test client authenticated as admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client
