"""
URL routing for Google Jules integration endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from integrations.jules.views import (
    JulesHealthView,
    JulesSourceViewSet,
    JulesRemediationJobViewSet,
    JulesSessionViewSet,
    JulesActivityListView,
    JulesSettingsView,
)

app_name = "jules"

router = DefaultRouter()
router.register(r"sources", JulesSourceViewSet, basename="jules-source")
router.register(r"remediations", JulesRemediationJobViewSet, basename="jules-remediation")
router.register(r"sessions", JulesSessionViewSet, basename="jules-session")

urlpatterns = [
    path("health/", JulesHealthView.as_view(), name="jules-health"),
    path("activity/", JulesActivityListView.as_view(), name="jules-activity"),
    path("settings/", JulesSettingsView.as_view(), name="jules-settings"),
    path("", include(router.urls)),
]
