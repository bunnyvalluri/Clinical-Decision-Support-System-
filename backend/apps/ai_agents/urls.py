from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.ai_agents.browser_views import (
    approved_destination_list_create_view,
    browser_agent_health_view,
    browser_agent_kill_switch_view,
    browser_task_approve_view,
    browser_task_cancel_view,
    browser_task_detail_view,
    browser_task_list_create_view,
    browser_task_reject_view,
    browser_tools_list_view,
)
from apps.ai_agents.views import (
    AgentApprovalViewSet,
    AgentDefinitionViewSet,
    AgentEvaluationViewSet,
    AgentExecutionViewSet,
    AgentFeedbackView,
    AgentHealthView,
    AgentRunView,
    AgentSessionViewSet,
    AgentToolsView,
)

app_name = "ai_agents"

router = DefaultRouter()
router.register(r"definitions", AgentDefinitionViewSet, basename="definition")
router.register(r"sessions", AgentSessionViewSet, basename="session")
router.register(r"executions", AgentExecutionViewSet, basename="execution")
router.register(r"approvals", AgentApprovalViewSet, basename="approval")
router.register(r"evaluations", AgentEvaluationViewSet, basename="evaluation")

urlpatterns = [
    # Browser Agent Controlled Endpoints
    path("browser/tasks/", browser_task_list_create_view, name="browser-task-list-create"),
    path("browser/tasks/<uuid:pk>/", browser_task_detail_view, name="browser-task-detail"),
    path("browser/tasks/<uuid:pk>/approve/", browser_task_approve_view, name="browser-task-approve"),
    path("browser/tasks/<uuid:pk>/reject/", browser_task_reject_view, name="browser-task-reject"),
    path("browser/tasks/<uuid:pk>/cancel/", browser_task_cancel_view, name="browser-task-cancel"),
    path("browser/destinations/", approved_destination_list_create_view, name="browser-destination-list-create"),
    path("browser/tools/", browser_tools_list_view, name="browser-tools-list"),
    path("browser/health/", browser_agent_health_view, name="browser-agent-health"),
    path("browser/kill-switch/", browser_agent_kill_switch_view, name="browser-agent-kill-switch"),

    path("run/", AgentRunView.as_view(), name="agent-run"),
    path("tools/", AgentToolsView.as_view(), name="agent-tools"),
    path("feedback/", AgentFeedbackView.as_view(), name="agent-feedback"),
    path("health/", AgentHealthView.as_view(), name="agent-health"),
    path("", include(router.urls)),
]
