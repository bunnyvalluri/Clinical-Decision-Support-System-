from django.urls import path
from apps.external_apis.views import (
    ExternalAPIRegistryListView,
    ExternalAPIRegistryDetailView,
    ExternalAPIApprovalListView,
    ExternalAPIHealthListView,
    ExternalAPIAuditLogListView,
    DrugSearchView,
    ProviderLookupView,
    NutritionSearchView,
    CircuitBreakerStatusView,
)

app_name = "external_apis"

urlpatterns = [
    path("registry/", ExternalAPIRegistryListView.as_view(), name="registry-list"),
    path("registry/<uuid:pk>/", ExternalAPIRegistryDetailView.as_view(), name="registry-detail"),
    path("approvals/", ExternalAPIApprovalListView.as_view(), name="approval-list"),
    path("health/", ExternalAPIHealthListView.as_view(), name="health-list"),
    path("audit/", ExternalAPIAuditLogListView.as_view(), name="audit-list"),
    path("drugs/search/", DrugSearchView.as_view(), name="drug-search"),
    path("providers/lookup/", ProviderLookupView.as_view(), name="provider-lookup"),
    path("nutrition/search/", NutritionSearchView.as_view(), name="nutrition-search"),
    path("circuit-breaker/", CircuitBreakerStatusView.as_view(), name="circuit-breaker"),
]
