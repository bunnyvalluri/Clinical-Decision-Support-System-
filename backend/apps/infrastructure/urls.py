"""
URL Routing for Infrastructure Management Platform.
Mounted at /api/v1/infrastructure/
"""

from django.urls import path
from .views import (
    InfrastructureHealthView,
    InfrastructureServersListView,
    DeploymentApplicationsListView,
    DeploymentHistoryListView,
    TriggerDeploymentView,
    RollbackDeploymentView,
)

app_name = "infrastructure"

urlpatterns = [
    path("health/", InfrastructureHealthView.as_view(), name="infra-health"),
    path("servers/", InfrastructureServersListView.as_view(), name="infra-servers"),
    path("applications/", DeploymentApplicationsListView.as_view(), name="infra-applications"),
    path("deployments/", DeploymentHistoryListView.as_view(), name="infra-deployments"),
    path("deploy/", TriggerDeploymentView.as_view(), name="infra-deploy"),
    path("rollback/", RollbackDeploymentView.as_view(), name="infra-rollback"),
]
