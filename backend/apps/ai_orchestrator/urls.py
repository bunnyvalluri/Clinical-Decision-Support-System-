from django.urls import path
from .views import (
    AgentMemoryListView,
    AgentRegistryView,
    AgentTaskDetailView,
    AgentTaskListView,
    AIAgentTraceListView,
    AIApprovalGateDecideView,
    AIApprovalGateListView,
    AIChatView,
    AIConversationArchiveView,
    AIConversationDetailView,
    AIConversationListView,
    AIEvaluationListView,
    AIEvaluationRunView,
    AIInteractionListView,
    AIModelConfigListView,
    AIObservabilityMetricsView,
    AIStreamView,
    ClinicalRulesEvaluateView,
    HumanReviewDecisionView,
    KnowledgeQueryView,
    MCPServerListView,
    ModelDriftListView,
    OrchestratorEvaluationView,
    RufloSwarmEvaluateView,
    ToolRegistryView,
)

app_name = "ai_orchestrator"

urlpatterns = [
    # Core Chat & Conversation Endpoints (Prompt 31)
    path("chat/", AIChatView.as_view(), name="ai-chat"),
    path("stream/", AIStreamView.as_view(), name="ai-stream"),
    path("conversations/", AIConversationListView.as_view(), name="conversations-list"),
    path("conversations/<uuid:conversation_id>/", AIConversationDetailView.as_view(), name="conversation-detail"),
    path("conversations/<uuid:conversation_id>/archive/", AIConversationArchiveView.as_view(), name="conversation-archive"),
    path("models/", AIModelConfigListView.as_view(), name="models-list"),
    path("evaluations/", AIEvaluationListView.as_view(), name="evaluations-list"),
    path("evaluations/run/", AIEvaluationRunView.as_view(), name="evaluations-run"),
    path("mcp/servers/", MCPServerListView.as_view(), name="mcp-servers-list"),

    # Core Clinical Orchestration & Rules
    path("orchestrator/evaluate/", OrchestratorEvaluationView.as_view(), name="orchestrator-evaluate"),
    path("rules/evaluate/", ClinicalRulesEvaluateView.as_view(), name="rules-evaluate"),
    path("knowledge/query/", KnowledgeQueryView.as_view(), name="knowledge-query"),
    path("human-review/", HumanReviewDecisionView.as_view(), name="human-review"),
    path("drift/", ModelDriftListView.as_view(), name="drift-list"),

    # Ruflo Multi-Agent Swarm Orchestration
    path("swarm/evaluate/", RufloSwarmEvaluateView.as_view(), name="swarm-evaluate"),
    path("tasks/", AgentTaskListView.as_view(), name="tasks-list"),
    path("tasks/<uuid:task_id>/", AgentTaskDetailView.as_view(), name="task-detail"),
    path("traces/", AIAgentTraceListView.as_view(), name="traces-list"),
    path("approvals/", AIApprovalGateListView.as_view(), name="approvals-list"),
    path("approvals/decide/", AIApprovalGateDecideView.as_view(), name="approvals-decide"),
    path("agents/", AgentRegistryView.as_view(), name="agents-registry"),
    path("tools/", ToolRegistryView.as_view(), name="tools-registry"),
    path("metrics/", AIObservabilityMetricsView.as_view(), name="observability-metrics"),
    path("memory/", AgentMemoryListView.as_view(), name="memory-list"),
    path("interactions/", AIInteractionListView.as_view(), name="interactions-list"),
]
