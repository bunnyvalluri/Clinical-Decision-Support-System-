"""
HealthNova AI — Brand Integrity & Configuration Tests
"""
import pytest
from django.contrib import admin
from rest_framework import status

from config import brand


class TestBrandConfiguration:
    """Validate backend centralized brand constants."""

    def test_brand_constants(self):
        assert brand.BRAND_NAME == "HealthNova AI"
        assert brand.BRAND_DISPLAY_NAME == "HealthNova AI"
        assert brand.BRAND_SHORT_NAME == "HN"
        assert "Clinical Decision Support" in brand.BRAND_TAGLINE
        assert "Patient Risk Intelligence" in brand.BRAND_TAGLINE
        assert brand.API_TITLE == "HealthNova AI API"

    def test_role_subtitles(self):
        assert brand.ROLE_SUBTITLES["DOCTOR"] == "Clinical Decision Support"
        assert brand.ROLE_SUBTITLES["NURSE"] == "Triage & Patient Risk Monitoring"
        assert brand.ROLE_SUBTITLES["ANALYST"] == "Clinical Data & Model Intelligence"
        assert brand.ROLE_SUBTITLES["ADMIN"] == "Platform & Security Administration"
        assert brand.ROLE_SUBTITLES["PATIENT"] == "Personal Health Intelligence"

    def test_academic_lineage_preserved(self):
        assert "Enhancing Clinical Decision Support Systems" in brand.ACADEMIC_PRIMARY_TITLE
        assert brand.PROJECT_CODE == "BPY-CSE-2666"

    def test_django_admin_branding(self):
        assert admin.site.site_header == "HealthNova AI Administration"
        assert admin.site.site_title == "HealthNova AI"
        assert admin.site.index_title == "HealthNova AI Administration"


@pytest.mark.django_db
class TestBrandEndpoints:
    """Validate API responses render HealthNova AI branding."""

    def test_health_check_service_branding(self, api_client):
        response = api_client.get("/api/v1/health/")
        assert response.status_code == status.HTTP_200_OK
        data = response.data["data"]
        assert data["service"] == "HealthNova AI API"
