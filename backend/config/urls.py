"""
Root URL configuration for BPY-CSE-2666.

All application endpoints are versioned under /api/v1/.
WebSocket routing is handled by Django Channels (see config/asgi.py).
"""
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from apps.ai_orchestrator.ollama_views import OllamaHealthView
from apps.ai_orchestrator.typed_decision_views import LayaCapabilitiesView, LayaHealthView
from apps.clinical.direct_urls import (
    alerts_router,
    evidence_router,
    guideline_router,
    guideline_version_router,
    knowledge_router,
    prediction_reviews_patterns,
    review_router,
    rules_router,
    safety_router,
    timeline_router,
)

admin.site.site_header = "HealthNova AI Administration"
admin.site.site_title = "HealthNova AI"
admin.site.index_title = "HealthNova AI Administration"

urlpatterns = [
    # Direct alias for Ollama Healthcheck
    path("api/ai/providers/ollama/health", OllamaHealthView.as_view(), name="ollama-health-direct"),
    path("api/ai/providers/ollama/health/", OllamaHealthView.as_view(), name="ollama-health-direct-slash"),
    # Prompt 68: Direct aliases for Laya-MLX Capabilities and Health
    path("api/ai/providers/laya/capabilities", LayaCapabilitiesView.as_view(), name="laya-capabilities-direct"),
    path("api/ai/providers/laya/capabilities/", LayaCapabilitiesView.as_view(), name="laya-capabilities-direct-slash"),
    path("api/ai/providers/laya/health", LayaHealthView.as_view(), name="laya-health-direct"),
    path("api/ai/providers/laya/health/", LayaHealthView.as_view(), name="laya-health-direct-slash"),
    # Admin interface
    path("admin/", admin.site.urls),

    # Prompt 64 — Clinical Knowledge, Guidelines, Rules, Evidence, Timeline, Safety, Reviews
    path("api/clinical-knowledge/", include(knowledge_router.urls)),
    path("api/v1/clinical-knowledge/", include(knowledge_router.urls)),
    path("api/guidelines/", include(guideline_router.urls)),
    path("api/v1/guidelines/", include(guideline_router.urls)),
    path("api/guideline-versions/", include(guideline_version_router.urls)),
    path("api/v1/guideline-versions/", include(guideline_version_router.urls)),
    path("api/clinical-rules/", include(rules_router.urls)),
    path("api/v1/clinical-rules/", include(rules_router.urls)),
    path("api/evidence/", include(evidence_router.urls)),
    path("api/v1/evidence/", include(evidence_router.urls)),
    path("api/patient-timeline/", include(timeline_router.urls)),
    path("api/v1/patient-timeline/", include(timeline_router.urls)),
    path("api/clinical-alerts/", include(alerts_router.urls)),
    path("api/v1/clinical-alerts/", include(alerts_router.urls)),
    path("api/prediction-reviews/", include((prediction_reviews_patterns, "prediction_reviews"))),
    path("api/v1/prediction-reviews/", include((prediction_reviews_patterns, "v1_prediction_reviews"))),
    path("api/ai/safety/", include(safety_router.urls)),
    path("api/v1/ai/safety/", include(safety_router.urls)),
    path("api/ai/review/", include(review_router.urls)),
    path("api/v1/ai/review/", include(review_router.urls)),

    # API v1 — all application REST endpoints
    path("api/v1/", include("apps.core.urls", namespace="core")),
    path("api/v1/auth/", include("apps.accounts.urls", namespace="accounts")),
    path("api/v1/patients/", include("apps.patients.urls", namespace="patients")),
    path("api/v1/clinical/", include("apps.clinical.urls", namespace="clinical")),
    path("api/v1/clinical-records/", include("apps.clinical.record_urls", namespace="clinical_records")),
    path("api/v1/predictions/", include("apps.predictions.urls", namespace="predictions")),
    path("api/v1/risk/", include("apps.predictions.risk_urls", namespace="risk")),
    path("api/v1/reports/", include("apps.reports.urls", namespace="reports")),
    path("api/v1/notifications/", include("apps.notifications.urls", namespace="notifications")),
    path("api/v1/ml/", include("apps.ml_engine.urls", namespace="ml_engine")),
    path("api/v1/models/", include("apps.model_registry.urls", namespace="model_registry")),
    path("api/v1/audit/", include("apps.audit.urls", namespace="audit")),
    path("api/v1/ai/agents/", include("apps.ai_agents.urls", namespace="ai_agents")),
    path("api/v1/ai-agents/", include("apps.ai_agents.urls", namespace="ai_agents_direct")),
    path("api/v1/ai/", include("apps.ai_orchestrator.urls", namespace="ai_orchestrator")),
    path("api/v1/external-apis/", include("apps.external_apis.urls", namespace="external_apis")),
    path("api/v1/user/", include("apps.patient_portal.urls")),
    path("api/v1/security/", include("apps.security_testing.urls", namespace="security_testing")),
    path("api/v1/mobile/", include("apps.mobile_gateway.urls", namespace="mobile_gateway")),
    path("api/v1/whiteboards/", include("apps.whiteboards.urls", namespace="whiteboards")),
    path("api/v1/nocodb/", include("apps.nocodb.urls", namespace="nocodb")),
    path("api/v1/search/", include("apps.search.urls", namespace="search")),
    path("api/v1/infrastructure/", include("apps.infrastructure.urls", namespace="infrastructure")),
    path("api/v1/web/", include(("apps.web_intelligence.urls", "web_intelligence"), namespace="web_intelligence")),
    path("api/web/", include(("apps.web_intelligence.urls", "web_intelligence"), namespace="web_intelligence_compat")),
    path("api/v1/engineering/", include("apps.engineering_loops.urls", namespace="engineering_loops")),
    path("api/engineering/", include("apps.engineering_loops.urls", namespace="engineering_loops_compat")),
    path("api/v1/blog/", include("apps.blog.urls", namespace="blog")),
    path("api/blog/", include(("apps.blog.urls", "blog"), namespace="blog_compat")),
    path("api/v1/automation/jules/", include("integrations.jules.urls", namespace="jules")),
    path("api/admin/automation/jules/", include("integrations.jules.urls", namespace="jules_admin_compat")),
    path("api/v1/informaticist/datasets/", include("apps.model_registry.kaggle_urls")),
    path("api/informaticist/datasets/", include("apps.model_registry.kaggle_urls")),
    path("api/v1/interoperability/", include("apps.interoperability.api.urls", namespace="interoperability")),
    path("fhir/r4/", include("apps.interoperability.api.fhir_urls")),
]


# Debug toolbar (development only)
if settings.DEBUG:
    import debug_toolbar  # noqa: PLC0415

    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
