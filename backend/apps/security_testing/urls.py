"""
URL routing for Security Testing & DevSecOps app (Strix integration).
All endpoints are rooted under /api/v1/security/.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.security_testing.views import (
    SecurityTargetViewSet,
    SecurityScanViewSet,
    SecurityFindingViewSet,
    SecurityReportViewSet,
    SecurityAuditEventViewSet,
    SecurityToolInventoryView,
    SecurityMetricsView,
    SecurityHealthView,
    SecurityKillSwitchView,
    SecurityAgentRunViewSet,
    SecurityAgentCapabilityViewSet,
    MCPToolRegistryViewSet,
    SecurityFindingClusterViewSet,
    PentestAgentsHealthView,
)

app_name = "security_testing"

router = DefaultRouter()
router.register(r"targets", SecurityTargetViewSet, basename="security-targets")
router.register(r"scans", SecurityScanViewSet, basename="security-scans")
router.register(r"findings", SecurityFindingViewSet, basename="security-findings")
router.register(r"reports", SecurityReportViewSet, basename="security-reports")
router.register(r"audit", SecurityAuditEventViewSet, basename="security-audit")
router.register(r"agents/runs", SecurityAgentRunViewSet, basename="security-agent-runs")
router.register(r"agents/capabilities", SecurityAgentCapabilityViewSet, basename="security-agent-capabilities")
router.register(r"agents/mcp-tools", MCPToolRegistryViewSet, basename="security-mcp-tools")
router.register(r"agents/clusters", SecurityFindingClusterViewSet, basename="security-finding-clusters")

urlpatterns = [
    path("tools/", SecurityToolInventoryView.as_view(), name="security-tools"),
    path("metrics/", SecurityMetricsView.as_view(), name="security-metrics"),
    path("health/", SecurityHealthView.as_view(), name="security-health"),
    path("kill-switch/", SecurityKillSwitchView.as_view(), name="security-kill-switch"),
    path("services/pentest-agents/health/", PentestAgentsHealthView.as_view(), name="pentest-agents-health"),
    path("", include(router.urls)),
]

