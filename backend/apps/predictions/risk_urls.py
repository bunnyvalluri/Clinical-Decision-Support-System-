"""
URL configuration for Clinical Risk Prediction and CDSS endpoints (/api/v1/risk/).
"""
from django.urls import path
from apps.predictions.risk_views import (
    PatientRiskDetailView,
    RiskDriftTelemetryView,
    RiskEvaluationListView,
    RiskFeatureDefinitionListView,
    RiskModelDetailView,
    RiskModelListView,
    RiskPredictionDetailView,
    RiskPredictionListCreateView,
    RiskReviewDecisionView,
    RiskRuleListView,
)

app_name = "risk"

urlpatterns = [
    path("predictions/", RiskPredictionListCreateView.as_view(), name="prediction_list_create"),
    path("predictions/<uuid:prediction_id>/", RiskPredictionDetailView.as_view(), name="prediction_detail"),
    path("predictions/<uuid:prediction_id>/reviews/", RiskReviewDecisionView.as_view(), name="prediction_review"),
    path("patients/<uuid:patient_id>/", PatientRiskDetailView.as_view(), name="patient_risk"),
    path("models/", RiskModelListView.as_view(), name="model_list"),
    path("models/<uuid:model_id>/", RiskModelDetailView.as_view(), name="model_detail"),
    path("evaluations/", RiskEvaluationListView.as_view(), name="evaluation_list"),
    path("features/", RiskFeatureDefinitionListView.as_view(), name="feature_list"),
    path("rules/", RiskRuleListView.as_view(), name="rule_list"),
    path("drift/", RiskDriftTelemetryView.as_view(), name="drift_telemetry"),
]
