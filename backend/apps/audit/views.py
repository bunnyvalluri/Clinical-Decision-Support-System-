"""Audit log views."""
from rest_framework import permissions, serializers, viewsets

from apps.core.models import AuditLog
from apps.core.pagination import StandardResultsPagination
from apps.core.permissions import IsAdmin


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "user_email",
            "action",
            "resource_type",
            "resource_id",
            "description",
            "ip_address",
            "user_agent",
            "metadata",
            "timestamp",
        ]
        read_only_fields = fields


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Administrative audit log viewset.
    GET /api/v1/audit/
    GET /api/v1/audit/{id}/
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsPagination
    queryset = AuditLog.objects.all().order_by("-timestamp")
    filterset_fields = ["action", "resource_type"]
    search_fields = ["description", "resource_id", "ip_address"]
