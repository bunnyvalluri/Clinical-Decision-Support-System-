"""
Views for notifications app — clinical staff alerts and user notifications.
"""
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from apps.notifications.models import Notification


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def notification_list_view(request: Request) -> Response:
    """List authenticated user notifications."""
    queryset = Notification.objects.filter(recipient=request.user).order_by("-created_at")[:50]
    results = []
    for item in queryset:
        results.append({
            "id": str(item.id),
            "title": item.title,
            "message": item.message,
            "severity": item.severity,
            "channel": item.channel,
            "is_read": item.is_read,
            "read_at": item.read_at.isoformat() if item.read_at else None,
            "created_at": item.created_at.isoformat(),
            "patient_mrn": item.patient.mrn if item.patient else None,
            "prediction_id": str(item.prediction.id) if item.prediction else None,
        })
    return Response({"success": True, "count": len(results), "data": results})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def notification_mark_read_view(request: Request, pk: str) -> Response:
    """Mark single notification as read."""
    try:
        item = Notification.objects.get(id=pk, recipient=request.user)
        item.mark_read()
        return Response({"success": True, "message": "Notification marked as read."})
    except (Notification.DoesNotExist, ValueError):
        return Response({"success": False, "error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def notification_mark_all_read_view(request: Request) -> Response:
    """Mark all unread notifications for the user as read."""
    from django.utils import timezone
    Notification.objects.filter(recipient=request.user, is_read=False).update(
        is_read=True,
        read_at=timezone.now()
    )
    return Response({"success": True, "message": "All notifications marked as read."})
