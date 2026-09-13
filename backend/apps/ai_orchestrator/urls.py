from django.urls import path
from .views import (
    ClinicalRulesEvaluateView,
    HumanReviewDecisionView,
    KnowledgeQueryView,
    ModelDriftListView,
    OrchestratorEvaluationView,
)

app_name = "ai_orchestrator"

urlpatterns = [
    path("orchestrator/evaluate/", OrchestratorEvaluationView.as_view(), name="orchestrator-evaluate"),
    path("rules/evaluate/", ClinicalRulesEvaluateView.as_view(), name="rules-evaluate"),
    path("knowledge/query/", KnowledgeQueryView.as_view(), name="knowledge-query"),
    path("human-review/", HumanReviewDecisionView.as_view(), name="human-review"),
    path("drift/", ModelDriftListView.as_view(), name="drift-list"),
]
