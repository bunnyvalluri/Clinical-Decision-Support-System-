"""
Shared pytest fixtures for the test suite.

Fixtures here are available to all tests without explicit import.
Domain-specific fixtures live in their respective test module conftest.py files.
"""
import random
import numpy as np
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture(autouse=True)
def set_deterministic_seed():
    """Ensure tests run with deterministic random seeds to eliminate flakiness."""
    random.seed(42)
    np.random.seed(42)


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch):
    """Ensure tests run hermetically without external network dependencies."""
    # Ensure offline mode for Kaggle client so it always uses deterministic curated benchmarks
    from integrations.kaggle.client import KaggleClient
    monkeypatch.setattr(KaggleClient, "_get_api", lambda self: None)
    monkeypatch.setenv("FIRECRAWL_API_KEY", "ci_test_firecrawl_key")



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
