"""
Views for model_registry app — registered models, version history, and lifecycle transitions.
Enforces that only Clinicians and Administrators can activate or roll back production models.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.exceptions import ApplicationError, NotFoundError
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import IsAdminOrClinician
from apps.model_registry.models import ModelVersion
from apps.model_registry.serializers import (
    ModelActivationSerializer,
    ModelRollbackSerializer,
    ModelVersionSerializer,
)


class ModelVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ML Model Version Registry endpoints.

    GET  /api/v1/models/             — List all registered model versions
    GET  /api/v1/models/{id}/        — Retrieve detailed model version metadata
    POST /api/v1/models/{id}/activate/ — Promote model version to production ACTIVE
    POST /api/v1/models/{id}/rollback/ — Roll back active model to a prior version
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
        except ModelVersion.DoesNotExist:
            raise NotFoundError(
                f"Target rollback version '{target_version}' does not exist for '{instance.model_name}'."
            )

        return Response(
            {
                "success": True,
                "message": f"Successfully rolled back {instance.model_name} to v{target_version}.",
                "data": ModelVersionSerializer(target_instance).data,
            },
            status=status.HTTP_200_OK,
        )
