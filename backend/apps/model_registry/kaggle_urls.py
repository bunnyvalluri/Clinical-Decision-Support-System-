"""
URL patterns for Kaggle dataset discovery, validation, lineage, approval, and training runs.
"""
from django.urls import path
from apps.model_registry.kaggle_views import (
    DatasetApproveView,
    DatasetDetailView,
    DatasetDiscoverView,
    DatasetImportView,
    DatasetLineageView,
    DatasetListView,
    DatasetQualityView,
    DatasetSchemaView,
    DatasetTrainingRunsView,
    DatasetTrainView,
    DatasetValidateView,
    KaggleAuthStatusView,
)

urlpatterns = [
    path("", DatasetListView.as_view(), name="dataset_list"),
    path("auth-status/", KaggleAuthStatusView.as_view(), name="dataset_auth_status"),
    path("discover/", DatasetDiscoverView.as_view(), name="dataset_discover"),
    path("import/", DatasetImportView.as_view(), name="dataset_import"),
    path("<uuid:dataset_id>/", DatasetDetailView.as_view(), name="dataset_detail"),
    path("<uuid:dataset_id>/validate/", DatasetValidateView.as_view(), name="dataset_validate"),
    path("<uuid:dataset_id>/quality/", DatasetQualityView.as_view(), name="dataset_quality"),
    path("<uuid:dataset_id>/schema/", DatasetSchemaView.as_view(), name="dataset_schema"),
    path("<uuid:dataset_id>/lineage/", DatasetLineageView.as_view(), name="dataset_lineage"),
    path("<uuid:dataset_id>/approve/", DatasetApproveView.as_view(), name="dataset_approve"),
    path("<uuid:dataset_id>/train/", DatasetTrainView.as_view(), name="dataset_train"),
    path("<uuid:dataset_id>/training-runs/", DatasetTrainingRunsView.as_view(), name="dataset_training_runs"),
]
