"""
URL routing for NocoDB Healthcare Analytics and Data Workspace endpoints.
"""
from django.urls import path
from apps.nocodb import views

app_name = "nocodb"

urlpatterns = [
    # Health & telemetry
    path("health/", views.NocoDBHealthView.as_view(), name="health"),

    # Datasets
    path("datasets/", views.NocoDBDatasetListView.as_view(), name="dataset_list"),
    path("datasets/<slug:slug>/", views.NocoDBDatasetDetailView.as_view(), name="dataset_detail"),
    path("datasets/<slug:slug>/rows/", views.NocoDBRowsView.as_view(), name="dataset_rows"),
    path("datasets/<slug:slug>/rows/<str:row_id>/", views.NocoDBRowDetailView.as_view(), name="row_detail"),
    path("datasets/<slug:slug>/export/", views.NocoDBExportView.as_view(), name="dataset_export"),
    path("datasets/<slug:slug>/views/", views.NocoDBViewPreferencesView.as_view(), name="dataset_views"),

    # Sync
    path("sync/trigger/", views.NocoDBSyncTriggerView.as_view(), name="sync_trigger"),

    # Audit logs
    path("audit-logs/", views.NocoDBAuditLogsView.as_view(), name="audit_logs"),

    # MCP Gateway
    path("mcp/execute/", views.NocoDBMCPExecuteView.as_view(), name="mcp_execute"),
]
