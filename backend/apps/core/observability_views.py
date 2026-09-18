"""
Observability & Reliability REST API Views for HealthNova AI.
Restricted via Role-Based Access Control (RBAC).
Provides real telemetry, health probes, alerting evaluation, and incident state tracking.
"""

import logging
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from integrations.observability import (
    AlertSeverity,
    IncidentSeverity,
    IncidentState,
    ObservabilityProvider,
)

logger = logging.getLogger(__name__)


class CanViewObservability(permissions.BasePermission):
    """
    IT Admins & Admins have full access.
    Medical Informaticists have read access to operational telemetry.
    Doctors and Nurses have read access to high-level clinical service availability.
    Patients are strictly forbidden (403).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        role = getattr(request.user, "role", "")
        is_admin = getattr(request.user, "is_admin", False) or getattr(request.user, "is_staff", False)

        if is_admin or role in (UserRole.ADMIN, UserRole.IT_ADMIN):
            return True

        if role in (UserRole.MEDICAL_INFORMATICIST, UserRole.ANALYST, "INFORMATICIST"):
            return request.method in permissions.SAFE_METHODS

        if role in (UserRole.DOCTOR, UserRole.NURSE):
            # Clinical roles only access safe read-only overview
            return request.method in permissions.SAFE_METHODS and view.__class__.__name__ in (
                "ObservabilityOverviewView",
                "ObservabilityHealthView",
            )

        return False


class CanManageIncidents(permissions.BasePermission):
    """Only IT Administrators and DevOps staff can manage incidents."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, "role", "")
        is_admin = getattr(request.user, "is_admin", False) or getattr(request.user, "is_staff", False)
        return is_admin or role in (UserRole.ADMIN, UserRole.IT_ADMIN)


class ObservabilityOverviewView(APIView):
    """
    GET /api/v1/observability/overview/
    Unified operational summary filtered by authenticated role.
    """
    permission_classes = [CanViewObservability]

    def get(self, request):
        provider = ObservabilityProvider()
        role = getattr(request.user, "role", "IT_ADMIN")
        data = provider.get_dashboard_summary(user_role=role)
        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


class ObservabilityHealthView(APIView):
    """
    GET /api/v1/observability/health/
    Detailed multi-tier dependency health checks.
    """
    permission_classes = [CanViewObservability]

    def get(self, request):
        provider = ObservabilityProvider()
        health = provider.get_system_health()
        return Response({"success": True, "data": health}, status=status.HTTP_200_OK)


class ObservabilityMetricsView(APIView):
    """
    GET /api/v1/observability/metrics/
    Real metric measurements across HTTP, ML, AI, Celery, and WebSockets.
    """
    permission_classes = [CanViewObservability]

    def get(self, request):
        provider = ObservabilityProvider()
        metrics = provider.get_system_metrics()
        return Response({"success": True, "data": metrics}, status=status.HTTP_200_OK)


class ObservabilityAlertsView(APIView):
    """
    GET /api/v1/observability/alerts/
    Active SLO/SLA rule evaluations with role-based filtering.
    """
    permission_classes = [CanViewObservability]

    def get(self, request):
        provider = ObservabilityProvider()
        role = getattr(request.user, "role", "IT_ADMIN")
        alerts = provider.alerts.get_alerts_for_role(role)
        return Response({"success": True, "count": len(alerts), "data": alerts}, status=status.HTTP_200_OK)


class ObservabilityIncidentsView(APIView):
    """
    GET /api/v1/observability/incidents/
    POST /api/v1/observability/incidents/
    List or report operational incidents.
    """
    permission_classes = [CanViewObservability]

    def get(self, request):
        provider = ObservabilityProvider()
        state = request.query_params.get("state")
        severity = request.query_params.get("severity")
        incidents = provider.incidents.list_incidents(state_filter=state, severity_filter=severity)
        return Response({"success": True, "count": len(incidents), "data": incidents}, status=status.HTTP_200_OK)

    def post(self, request):
        if not CanManageIncidents().has_permission(request, self):
            return Response({"error": "Forbidden: Only IT Administrators can create incidents."}, status=status.HTTP_403_FORBIDDEN)

        title = request.data.get("title")
        severity_str = request.data.get("severity", "SEV3_MEDIUM")
        service = request.data.get("service", "core")
        notes = request.data.get("notes", "Manually logged by operator.")

        if not title:
            return Response({"error": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            severity = IncidentSeverity(severity_str)
        except ValueError:
            return Response({"error": f"Invalid severity. Allowed: {[s.value for s in IncidentSeverity]}"}, status=status.HTTP_400_BAD_REQUEST)

        provider = ObservabilityProvider()
        inc = provider.incidents.create_incident(
            title=title,
            severity=severity,
            service=service,
            actor=getattr(request.user, "email", str(request.user)),
            initial_notes=notes,
        )

        return Response({"success": True, "incident": vars(inc)}, status=status.HTTP_201_CREATED)


class ObservabilityIncidentTransitionView(APIView):
    """
    PATCH /api/v1/observability/incidents/<incident_id>/
    Advance incident lifecycle state.
    """
    permission_classes = [CanManageIncidents]

    def patch(self, request, incident_id):
        new_state_str = request.data.get("state")
        note = request.data.get("note", "")
        resolution_summary = request.data.get("resolution_summary")

        if not new_state_str:
            return Response({"error": "state is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_state = IncidentState(new_state_str)
        except ValueError:
            return Response({"error": f"Invalid state. Allowed: {[s.value for s in IncidentState]}"}, status=status.HTTP_400_BAD_REQUEST)

        provider = ObservabilityProvider()
        try:
            inc = provider.incidents.transition_state(
                incident_id=incident_id,
                new_state=new_state,
                actor=getattr(request.user, "email", str(request.user)),
                note=note,
                resolution_summary=resolution_summary,
            )
            return Response({"success": True, "incident": vars(inc)}, status=status.HTTP_200_OK)
        except KeyError:
            return Response({"error": f"Incident {incident_id} not found."}, status=status.HTTP_404_NOT_FOUND)
