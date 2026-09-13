"""
Reusable view mixins for DRF ViewSets and APIViews.

Mixins provide cross-cutting behaviour (audit logging, soft-delete,
serializer routing) without polluting individual view classes.
"""
import logging
from typing import Any

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from apps.core.models import AuditLog

logger = logging.getLogger(__name__)


class AuditLogMixin:
    """
    Mixin that writes an AuditLog entry on create/update/delete actions.

    Subclasses must set ``audit_resource_type`` to the string name of the
    resource being managed (e.g. ``"Patient"``).
    """

    audit_resource_type: str = "Unknown"

    def _log(
        self,
        request: Request,
        action: str,
        resource_id: str = "",
        description: str = "",
        metadata: dict[str, Any] | None = None,
    ) -> None:
        try:
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action=action,
                resource_type=self.audit_resource_type,
                resource_id=resource_id,
                description=description,
                ip_address=_get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:512],
                metadata=metadata or {},
            )
        except Exception:
            logger.exception("Failed to write audit log entry — non-fatal, continuing.")

    def perform_create(self, serializer: Serializer) -> None:
        instance = serializer.save()
        self._log(
            self.request,  # type: ignore[attr-defined]
            action=AuditLog.Action.CREATE,
            resource_id=str(instance.pk),
            description=f"Created {self.audit_resource_type}.",
        )

    def perform_update(self, serializer: Serializer) -> None:
        instance = serializer.save()
        self._log(
            self.request,  # type: ignore[attr-defined]
            action=AuditLog.Action.UPDATE,
            resource_id=str(instance.pk),
            description=f"Updated {self.audit_resource_type}.",
        )

    def perform_destroy(self, instance) -> None:
        self._log(
            self.request,  # type: ignore[attr-defined]
            action=AuditLog.Action.DELETE,
            resource_id=str(instance.pk),
            description=f"Deleted {self.audit_resource_type}.",
        )
        instance.delete()


class SerializerActionMixin:
    """
    Mixin that selects a different serializer class per action.

    Subclasses define ``serializer_classes`` dict mapping action names to
    serializer classes, falling back to ``serializer_class``.

    Example::

        serializer_classes = {
            "list": PatientListSerializer,
            "retrieve": PatientDetailSerializer,
            "create": PatientCreateSerializer,
        }
    """

    serializer_classes: dict[str, type[Serializer]] = {}

    def get_serializer_class(self) -> type[Serializer]:
        action = getattr(self, "action", None)
        if action and action in self.serializer_classes:
            return self.serializer_classes[action]
        return super().get_serializer_class()  # type: ignore[misc]


def _get_client_ip(request: Request) -> str | None:
    """Extract the real client IP, respecting X-Forwarded-For."""
    x_forwarded_for: str | None = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
