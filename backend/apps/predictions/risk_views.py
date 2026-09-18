"""
REST API ViewSets and Views for Clinical Risk Level Prediction and CDSS — BPY-CSE-2666.
Exposes standard research endpoints under /api/v1/risk/ and /api/v1/patients/{patient_id}/risk/.
"""
from typing import Any, Dict
from uuid import UUID

from django.db.models import QuerySet
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.clinical.models import ClinicalFeatureDefinition, ClinicalRule
from apps.clinical.serializers import ClinicalFeatureDefinitionSerializer, ClinicalRuleSerializer
from apps.core.exceptions import ApplicationError
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import HasPredictionAccess, IsAdminOrClinician
from apps.model_registry.models import DriftReport, ModelEvaluation, ModelVersion
from apps.predictions.models import ClinicalReview, Prediction, PredictionExplanation, RiskLevel
from apps.predictions.serializers import (
    ClinicalOverrideSerializer,
    PredictionListSerializer,
    PredictionRequestSerializer,
    PredictionSerializer,
)
from services.clinical_decision_support_service import ClinicalDecisionSupportService
from services.feature_preprocessor import FeatureValidationError
from services.prediction_service import PredictionService, PredictionServiceError


class RiskPredictionListCreateView(APIView):
    """
    POST /api/v1/risk/predictions/ -> Run real-time risk assessment & CDSS.
    GET  /api/v1/risk/predictions/ -> List historical risk predictions with filtering.
    """
    permission_classes = [permissions.IsAuthenticated, HasPredictionAccess]
    pagination_class = StandardResultsPagination

    def get(self, request: Request) -> Response:
        user = request.user
        qs = Prediction.objects.select_related(
            "patient",
            "model_version",
            "clinical_record",
            "overridden_by",
            "explanation",
        ).order_by("-prediction_timestamp")

        if getattr(user, "is_patient", user.role == UserRole.PATIENT):
            qs = qs.filter(patient__user=user)

        patient_id = request.query_params.get("patient_id")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        risk_level = request.query_params.get("risk_level")
        if risk_level:
            qs = qs.filter(prediction_result=risk_level.upper())

        model_name = request.query_params.get("model_name")
        if model_name:
            qs = qs.filter(model_name=model_name)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        serializer = PredictionListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request: Request) -> Response:
        serializer = PredictionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = PredictionService()
        try:
            prediction = service.predict_patient(
                patient_id=data["patient_id"],
                clinical_record_id=data.get("clinical_record_id"),
                model_name=data.get("model_name"),
                vitals=data.get("vitals"),
                requested_by=request.user,
            )
        except FeatureValidationError as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": getattr(exc, "code", "VALIDATION_ERROR"),
                        "message": str(exc),
                        "details": getattr(exc, "errors", []),
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ApplicationError as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": getattr(exc, "code", "prediction_error"),
                        "message": str(exc.message if hasattr(exc, "message") else exc),
                    },
                },
                status=getattr(exc, "status_code", status.HTTP_400_BAD_REQUEST),
            )
        except Exception as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "prediction_execution_failed",
                        "message": "The clinical prediction service was unable to complete assessment.",
                        "detail": str(exc),
                    },
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        resp_serializer = PredictionSerializer(prediction)
        return Response(resp_serializer.data, status=status.HTTP_201_CREATED)


class RiskPredictionDetailView(APIView):
    """
    GET /api/v1/risk/predictions/{prediction_id}/
    Retrieve full prediction detail, TreeSHAP explanation, and CDSS synthesis.
    """
    permission_classes = [permissions.IsAuthenticated, HasPredictionAccess]

    def get(self, request: Request, prediction_id: UUID) -> Response:
        user = request.user
        try:
            prediction = Prediction.objects.select_related(
                "patient", "model_version", "clinical_record", "overridden_by", "explanation"
            ).get(id=prediction_id)
        except Prediction.DoesNotExist:
            return Response({"error": "Prediction not found"}, status=status.HTTP_404_NOT_FOUND)

        if getattr(user, "is_patient", user.role == UserRole.PATIENT) and prediction.patient.user_id != user.id:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = PredictionSerializer(prediction)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PatientRiskDetailView(APIView):
    """
    GET /api/v1/patients/{patient_id}/risk/
    Retrieve latest risk assessment, longitudinal risk trajectory, and CDSS guidance for patient.
    """
    permission_classes = [permissions.IsAuthenticated, HasPredictionAccess]

    def get(self, request: Request, patient_id: UUID) -> Response:
        user = request.user
        from apps.patients.models import Patient
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

        if getattr(user, "is_patient", user.role == UserRole.PATIENT) and patient.user_id != user.id:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        recent_predictions = list(
            Prediction.objects.filter(patient=patient)
            .select_related("explanation", "overridden_by")
            .order_by("-prediction_timestamp")[:10]
        )

        latest_prediction = recent_predictions[0] if recent_predictions else None
        latest_data = PredictionSerializer(latest_prediction).data if latest_prediction else None

        trajectory = [
            {
                "prediction_id": str(p.id),
                "timestamp": p.prediction_timestamp.isoformat(),
                "risk_level": p.prediction_result,
                "probability": float(p.probability),
                "model_name": p.model_name,
                "is_abstaining": p.is_abstaining,
                "clinician_override": p.clinician_override,
            }
            for p in reversed(recent_predictions)
        ]

        return Response(
            {
                "patient_id": str(patient.id),
                "patient_mrn": patient.mrn,
                "latest_risk": latest_data,
                "has_prediction": latest_prediction is not None,
                "risk_trajectory": trajectory,
                "total_predictions": len(recent_predictions),
            },
            status=status.HTTP_200_OK,
        )


class RiskModelListView(APIView):
    """
    GET /api/v1/risk/models/
    List registered machine learning models (Random Forest, SVM, AdaBoost) with actual metrics.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        models_qs = ModelVersion.objects.all().order_by("-created_at")
        data = []
        for m in models_qs:
            data.append({
                "id": str(m.id),
                "model_name": m.model_name,
                "algorithm": m.algorithm,
                "version": m.version,
                "status": m.status,
                "is_active": m.is_active,
                "artifact_location": m.artifact_location,
                "checksum": m.checksum,
                "training_dataset_identifier": m.training_dataset_identifier,
                "feature_schema_version": m.feature_schema_version,
                "preprocessing_version": m.preprocessing_version,
                "accuracy": float(m.accuracy) if m.accuracy is not None else None,
                "precision": float(m.precision) if m.precision is not None else None,
                "recall": float(m.recall) if m.recall is not None else None,
                "f1_score": float(m.f1_score) if m.f1_score is not None else None,
                "roc_auc": float(m.roc_auc) if m.roc_auc is not None else None,
                "hyperparameters": m.hyperparameters,
                "metrics": m.metrics,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "activated_at": m.activated_at.isoformat() if m.activated_at else None,
            })
        return Response({"models": data, "count": len(data)}, status=status.HTTP_200_OK)


class RiskModelDetailView(APIView):
    """
    GET /api/v1/risk/models/{model_id}/
    Detail view for specific model version.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, model_id: UUID) -> Response:
        try:
            m = ModelVersion.objects.get(id=model_id)
        except ModelVersion.DoesNotExist:
            return Response({"error": "Model not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "id": str(m.id),
            "model_name": m.model_name,
            "algorithm": m.algorithm,
            "version": m.version,
            "status": m.status,
            "is_active": m.is_active,
            "checksum": m.checksum,
            "training_dataset_identifier": m.training_dataset_identifier,
            "feature_schema_version": m.feature_schema_version,
            "preprocessing_version": m.preprocessing_version,
            "accuracy": float(m.accuracy) if m.accuracy is not None else None,
            "precision": float(m.precision) if m.precision is not None else None,
            "recall": float(m.recall) if m.recall is not None else None,
            "f1_score": float(m.f1_score) if m.f1_score is not None else None,
            "roc_auc": float(m.roc_auc) if m.roc_auc is not None else None,
            "hyperparameters": m.hyperparameters,
            "metrics": m.metrics,
            "training_dataset_info": m.training_dataset_info,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "activated_at": m.activated_at.isoformat() if m.activated_at else None,
        }, status=status.HTTP_200_OK)


class RiskEvaluationListView(APIView):
    """
    GET /api/v1/risk/evaluations/
    Comparative evaluation benchmarks for Random Forest, SVM, and AdaBoost models.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        evals_qs = ModelEvaluation.objects.select_related("model_version", "dataset_version").order_by("-created_at")
        results = []
        for ev in evals_qs:
            mv = ev.model_version
            results.append({
                "evaluation_id": str(ev.id),
                "model_id": str(mv.id),
                "model_name": mv.model_name,
                "algorithm": mv.algorithm,
                "version": mv.version,
                "status": mv.status,
                "dataset": ev.dataset_version.dataset_identifier if ev.dataset_version else mv.training_dataset_identifier,
                "metrics": ev.metrics,
                "fairness_metrics": ev.fairness_metrics,
                "brier_score": float(ev.brier_score) if ev.brier_score is not None else None,
                "passed_safety_gates": ev.passed_safety_gates,
                "created_at": ev.created_at.isoformat() if ev.created_at else None,
            })
        return Response({"evaluations": results, "count": len(results)}, status=status.HTTP_200_OK)


class RiskFeatureDefinitionListView(APIView):
    """
    GET /api/v1/risk/features/
    List active clinical feature definitions and validation limits.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        features = ClinicalFeatureDefinition.objects.filter(is_active=True).order_by("clinical_category", "name")
        serializer = ClinicalFeatureDefinitionSerializer(features, many=True)
        return Response({"features": serializer.data, "count": len(serializer.data)}, status=status.HTTP_200_OK)


class RiskRuleListView(APIView):
    """
    GET /api/v1/risk/rules/
    List active deterministic clinical safety rules.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        rules = ClinicalRule.objects.filter(approval_status="APPROVED").order_by("-severity", "rule_name")
        serializer = ClinicalRuleSerializer(rules, many=True)
        return Response({"rules": serializer.data, "count": len(serializer.data)}, status=status.HTTP_200_OK)


class RiskDriftTelemetryView(APIView):
    """
    GET /api/v1/risk/drift/
    Feature drift and distribution shift telemetry.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrClinician]

    def get(self, request: Request) -> Response:
        reports = DriftReport.objects.select_related("model_version").order_by("-evaluation_timestamp")[:10]
        data = [
            {
                "report_id": str(r.id),
                "model_name": r.model_version.model_name,
                "model_version": r.model_version.version,
                "status": r.status,
                "timestamp": r.evaluation_timestamp.isoformat(),
                "feature_drift_scores": r.feature_drift_scores,
                "prediction_drift_score": float(r.prediction_drift_score),
                "features_drifted": r.features_drifted,
                "summary": r.summary,
            }
            for r in reports
        ]
        return Response({"drift_reports": data, "count": len(data)}, status=status.HTTP_200_OK)


class RiskReviewDecisionView(APIView):
    """
    POST /api/v1/risk/predictions/{prediction_id}/reviews/
    Record clinician concurrence or clinical override with mandatory rationale.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrClinician]

    def post(self, request: Request, prediction_id: UUID) -> Response:
        serializer = ClinicalOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = PredictionService()
        try:
            updated = service.record_clinical_override(
                prediction_id=prediction_id,
                clinician_override=data["clinician_override"],
                override_reason=data["override_reason"],
                user=request.user,
            )
        except Prediction.DoesNotExist:
            return Response({"error": "Prediction not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(PredictionSerializer(updated).data, status=status.HTTP_200_OK)
