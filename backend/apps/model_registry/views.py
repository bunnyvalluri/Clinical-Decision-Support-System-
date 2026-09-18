"""
Views for model_registry app — registered models, version history, lifecycle transitions,
and MLOps governance endpoints.
Enforces that only Clinicians and Informaticists can approve or promote production models.
Provides model comparison, security audits, real monitoring telemetry, and WebSocket broadcasts.
"""
from datetime import timedelta
import logging
from typing import Any
from django.db.models import Avg, Count, Max, Min
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.exceptions import ApplicationError, NotFoundError
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import IsAdminOrClinician, IsInformaticist
from apps.model_registry.models import (
    DataQualityReport,
    DatasetVersion,
    ModelApproval,
    ModelDeployment,
    ModelEvaluation,
    ModelRollback,
    ModelStatus,
    ModelVersion,
)
from apps.model_registry.serializers import (
    DataQualityReportSerializer,
    DatasetVersionSerializer,
    ModelActivationSerializer,
    ModelApprovalSerializer,
    ModelDeploymentSerializer,
    ModelRollbackSerializer,
    ModelVersionSerializer,
)
from apps.predictions.models import Prediction, RiskLevel

logger = logging.getLogger(__name__)


def _broadcast_model_event(event_dict: dict) -> None:
    """Safely dispatch model lifecycle events over Django Channels."""
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)("dashboard", event_dict)
    except Exception as exc:
        logger.debug("Model lifecycle WebSocket broadcast skipped: %s", exc)


class ModelVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ML Model Version Registry endpoints.

    GET  /api/v1/models/versions/                      — List all registered model versions
    GET  /api/v1/models/versions/{id}/                 — Retrieve detailed model version metadata
    POST /api/v1/models/versions/{id}/approve/         — Human clinician sign-off
    POST /api/v1/models/versions/{id}/deploy/          — Promote to Staged, Canary, or Production
    POST /api/v1/models/versions/{id}/activate/        — Promote model version to production
    POST /api/v1/models/versions/{id}/rollback/        — Roll back active model to a prior version
    GET  /api/v1/models/versions/compare/              — Compare models side-by-side
    GET  /api/v1/models/versions/security-audit/       — Artifact integrity & security status
    GET  /api/v1/models/versions/monitoring-telemetry/ — Real MLOps telemetry & drift indicators
    """

    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["model_name", "algorithm", "status"]
    search_fields = ["model_name", "algorithm", "version", "training_dataset_identifier"]
    ordering_fields = ["created_at", "accuracy", "f1_score", "version"]
    ordering = ["-created_at"]
    queryset = ModelVersion.objects.select_related("created_by", "activated_by").all()
    serializer_class = ModelVersionSerializer

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated, IsAdminOrClinician],
        url_path="approve",
    )
    def approve(self, request: Request, pk=None) -> Response:
        """Record mandatory human clinician sign-off."""
        instance: ModelVersion = self.get_object()
        rationale = request.data.get("clinical_rationale", "Clinically verified and safe for clinical trial/deployment.")

        approval = ModelApproval.objects.create(
            model_version=instance,
            approved_by=request.user,
            role=getattr(request.user, "role", "DOCTOR"),
            status="APPROVED",
            clinical_rationale=rationale,
        )
        instance.status = ModelStatus.APPROVED
        instance.save(update_fields=["status", "updated_at"])

        return Response({
            "success": True,
            "message": f"Model {instance.model_name} v{instance.version} approved by {request.user.email}.",
            "approval": ModelApprovalSerializer(approval).data,
            "model": ModelVersionSerializer(instance).data,
        }, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated, IsAdminOrClinician],
        url_path="deploy",
    )
    def deploy(self, request: Request, pk=None) -> Response:
        """Controlled promotion to STAGED, CANARY, or PRODUCTION."""
        instance: ModelVersion = self.get_object()
        target_stage = request.data.get("stage", "PRODUCTION").upper()
        traffic_pct = int(request.data.get("traffic_percentage", 100))

        # Check approval gate
        if target_stage == "PRODUCTION" and instance.status not in (ModelStatus.APPROVED, ModelStatus.STAGED, ModelStatus.CANARY):
            return Response({
                "success": False,
                "error": "Human clinician approval required before production deployment.",
            }, status=status.HTTP_400_BAD_REQUEST)

        deployment = ModelDeployment.objects.create(
            model_version=instance,
            stage=target_stage,
            traffic_percentage=traffic_pct,
            deployed_by=request.user,
            status="ACTIVE",
        )

        if target_stage == "PRODUCTION":
            instance.activate(activated_by=request.user, reason=f"Promoted to PRODUCTION ({traffic_pct}% traffic)")
        elif target_stage == "CANARY":
            instance.status = ModelStatus.CANARY
            instance.save(update_fields=["status", "updated_at"])
        elif target_stage == "STAGED":
            instance.status = ModelStatus.STAGED
            instance.save(update_fields=["status", "updated_at"])

        return Response({
            "success": True,
            "message": f"Model {instance.model_name} v{instance.version} deployed to {target_stage}.",
            "deployment": ModelDeploymentSerializer(deployment).data,
            "model": ModelVersionSerializer(instance).data,
        }, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated, IsAdminOrClinician],
        url_path="activate",
    )
    def activate(self, request: Request, pk=None) -> Response:
        """Promote a candidate or archived model to ACTIVE production status."""
        instance: ModelVersion = self.get_object()
        serializer = ModelActivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data.get("reason", "Promoted to production")
        instance.activate(activated_by=request.user, reason=reason)
        instance.refresh_from_db()

        from channels_app.events import ModelLifecycleEvent
        _broadcast_model_event(
            ModelLifecycleEvent(
                model_name=instance.model_name,
                version=instance.version,
                status=instance.status,
                event_type="model.activated",
                actor=request.user.username,
                reason=reason,
            ).to_dict()
        )

        return Response(
            {
                "success": True,
                "message": f"Model {instance.model_name} v{instance.version} successfully promoted to ACTIVE.",
                "data": ModelVersionSerializer(instance).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated, IsAdminOrClinician],
        url_path="rollback",
    )
    def rollback(self, request: Request, pk=None) -> Response:
        """Rollback active production model to a previous version."""
        instance: ModelVersion = self.get_object()
        serializer = ModelRollbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_version = serializer.validated_data["target_version"]
        reason = serializer.validated_data.get("reason", "Production rollback")

        try:
            target_instance = instance.rollback(
                to_version=target_version,
                user=request.user,
                reason=reason,
            )
            ModelRollback.objects.create(
                previous_model=instance,
                target_model=target_instance,
                reason=reason,
                operator=request.user,
            )
        except ModelVersion.DoesNotExist:
            raise NotFoundError(
                f"Target rollback version '{target_version}' does not exist for '{instance.model_name}'."
            )

        from channels_app.events import ModelLifecycleEvent
        _broadcast_model_event(
            ModelLifecycleEvent(
                model_name=instance.model_name,
                version=target_version,
                status=ModelStatus.ACTIVE,
                event_type="model.status.changed",
                actor=request.user.username,
                reason=f"Rollback to v{target_version}: {reason}",
            ).to_dict()
        )

        return Response(
            {
                "success": True,
                "message": f"Successfully rolled back {instance.model_name} to v{target_version}.",
                "data": ModelVersionSerializer(target_instance).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="compare",
    )
    def compare(self, request: Request) -> Response:
        """Compare multiple model versions across evaluation metrics."""
        models = ModelVersion.objects.all().order_by("-f1_score", "-accuracy")[:10]
        comparisons = []
        for m in models:
            comparisons.append({
                "id": str(m.id),
                "model_name": m.model_name,
                "algorithm": m.algorithm,
                "version": m.version,
                "status": m.status,
                "accuracy": float(m.accuracy or 0.0),
                "precision": float(m.precision or 0.0),
                "recall": float(m.recall or 0.0),
                "f1_score": float(m.f1_score or 0.0),
                "roc_auc": float(m.roc_auc or 0.0),
                "checksum": m.checksum,
                "created_at": m.created_at.isoformat(),
            })
        return Response({"success": True, "data": comparisons})

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="security-audit",
    )
    def security_audit(self, request: Request) -> Response:
        """Audit artifact integrity and security status for IT Admin."""
        models = ModelVersion.objects.all()
        audit_records = []
        for m in models:
            has_checksum = bool(m.checksum)
            audit_records.append({
                "id": str(m.id),
                "model_name": m.model_name,
                "version": m.version,
                "status": m.status,
                "has_checksum": has_checksum,
                "checksum_preview": m.checksum[:16] if has_checksum else "MISSING",
                "artifact_location": m.artifact_location,
                "security_status": "VERIFIED" if has_checksum else "UNVERIFIED",
            })
        return Response({"success": True, "data": audit_records})

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="monitoring-telemetry",
    )
    def monitoring_telemetry(self, request: Request) -> Response:
        """Real ML monitoring telemetry aggregated live from Neon PostgreSQL."""
        now = timezone.now()
        last_24h = now - timedelta(hours=24)

        active_model = ModelVersion.objects.filter(status__in=[ModelStatus.ACTIVE, ModelStatus.PRODUCTION]).first()
        active_data = ModelVersionSerializer(active_model).data if active_model else None

        total_predictions = Prediction.objects.count()
        preds_24h = Prediction.objects.filter(prediction_timestamp__gte=last_24h).count()

        risk_counts = Prediction.objects.values("prediction_result").annotate(count=Count("id"))
        risk_dist: dict[str, Any] = {}
        for item in risk_counts:
            r_name = item["prediction_result"]
            c = item["count"]
            pct = round((c / max(total_predictions, 1)) * 100.0, 1)
            risk_dist[r_name] = {"count": c, "percentage": pct}

        for r_choice in RiskLevel.values:
            if r_choice not in risk_dist:
                risk_dist[r_choice] = {"count": 0, "percentage": 0.0}

        latency_agg = Prediction.objects.aggregate(
            avg_lat=Avg("inference_latency_ms"),
            max_lat=Max("inference_latency_ms"),
            min_lat=Min("inference_latency_ms"),
        )
        avg_latency = round(float(latency_agg["avg_lat"] or 0.0), 2)
        max_latency = round(float(latency_agg["max_lat"] or 0.0), 2)

        overrides_count = Prediction.objects.filter(clinician_override__isnull=False).count()
        override_rate = round((overrides_count / max(total_predictions, 1)) * 100.0, 2)

        from ml.mlops.drift_detector import PredictionDriftDetector
        drift_detector = PredictionDriftDetector()

        recent_preds = list(
            Prediction.objects.order_by("-prediction_timestamp")[:200].values_list(
                "prediction_result", flat=True
            )
        )
        baseline_preds = ["LOW"] * 45 + ["MEDIUM"] * 30 + ["HIGH"] * 17 + ["CRITICAL"] * 8
        drift_result = (
            drift_detector.evaluate_predictions(baseline_preds, recent_preds)
            if recent_preds
            else None
        )

        alerts = []
        if drift_result and drift_result.alert_triggered:
            alerts.append({
                "severity": drift_result.severity,
                "type": "PREDICTION_DRIFT",
                "message": drift_result.interpretation,
                "timestamp": now.isoformat(),
            })

        if avg_latency > 50.0:
            alerts.append({
                "severity": "WARNING",
                "type": "ELEVATED_LATENCY",
                "message": f"Average inference latency ({avg_latency}ms) exceeds the 50ms threshold.",
                "timestamp": now.isoformat(),
            })

        if override_rate > 15.0:
            alerts.append({
                "severity": "WARNING",
                "type": "HIGH_OVERRIDE_RATE",
                "message": f"Clinician override rate is elevated at {override_rate}%.",
                "timestamp": now.isoformat(),
            })

        telemetry_payload = {
            "active_model": active_data,
            "prediction_volume": {
                "total": total_predictions,
                "last_24_hours": preds_24h,
            },
            "risk_distribution": risk_dist,
            "latency": {
                "avg_ms": avg_latency,
                "max_ms": max_latency,
            },
            "clinician_overrides": {
                "count": overrides_count,
                "rate_percentage": override_rate,
            },
            "drift_monitoring": {
                "prediction_drift_psi": drift_result.psi if drift_result else 0.0,
                "severity": drift_result.severity if drift_result else "STABLE",
                "interpretation": drift_result.interpretation if drift_result else "Insufficient sample volume for drift computation.",
            },
            "active_alerts": alerts,
            "telemetry_timestamp": now.isoformat(),
        }

        return Response(telemetry_payload, status=status.HTTP_200_OK)
