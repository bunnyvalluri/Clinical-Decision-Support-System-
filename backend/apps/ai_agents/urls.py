from django.urls import include, path
from rest_framework.routers import DefaultRouter
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
    path("run/", AgentRunView.as_view(), name="agent-run"),
    path("tools/", AgentToolsView.as_view(), name="agent-tools"),
    path("feedback/", AgentFeedbackView.as_view(), name="agent-feedback"),
    path("health/", AgentHealthView.as_view(), name="agent-health"),
    path("", include(router.urls)),
]
