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
    RecoveryTargetConfigView,
    BackupListCreateView,
    BackupValidateView,
    DisasterRecoveryDrillView,
    BusinessContinuityMatrixView,
    IaCPlanView,
    IaCApplyView,
    DriftDetectionView,
    InfrastructurePolicyView,
    CostGovernanceView,
    InfrastructureTopologyView,
)

app_name = "infrastructure"

urlpatterns = [
    path("health/", InfrastructureHealthView.as_view(), name="infra-health"),
    path("servers/", InfrastructureServersListView.as_view(), name="infra-servers"),
    path("applications/", DeploymentApplicationsListView.as_view(), name="infra-applications"),
    path("deployments/", DeploymentHistoryListView.as_view(), name="infra-deployments"),
    path("deploy/", TriggerDeploymentView.as_view(), name="infra-deploy"),
    path("rollback/", RollbackDeploymentView.as_view(), name="infra-rollback"),
    # BCDR Endpoints
    path("backup/", BackupListCreateView.as_view(), name="infra-backup-list"),
    path("backup/validate/", BackupValidateView.as_view(), name="infra-backup-validate"),
    path("dr/rpo-rto/", RecoveryTargetConfigView.as_view(), name="infra-rpo-rto"),
    path("dr/drill/", DisasterRecoveryDrillView.as_view(), name="infra-dr-drill"),
    path("continuity/", BusinessContinuityMatrixView.as_view(), name="infra-continuity"),
    # IaC & Cloud Hardening Platform Governance Endpoints
    path("iac/plans/", IaCPlanView.as_view(), name="infra-iac-plans"),
    path("iac/apply/", IaCApplyView.as_view(), name="infra-iac-apply"),
    path("iac/drift/", DriftDetectionView.as_view(), name="infra-iac-drift"),
    path("governance/policies/", InfrastructurePolicyView.as_view(), name="infra-governance-policies"),
    path("governance/costs/", CostGovernanceView.as_view(), name="infra-governance-costs"),
    path("topology/", InfrastructureTopologyView.as_view(), name="infra-topology"),
]

