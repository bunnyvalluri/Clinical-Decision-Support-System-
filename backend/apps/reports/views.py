"""
Reports views and viewsets.
Provides asynchronous report compilation endpoints, status polling, and secure file downloads.
"""
import logging
import os
from pathlib import Path

from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.core.pagination import StandardResultsPagination
from apps.reports.models import Report, ReportFormat, ReportStatus, ReportType
from apps.reports.serializers import (
    ReportCreateRequestSerializer,
    ReportSerializer,
    TaskStatusResponseSerializer,
)
from apps.reports.tasks import generate_pdf_report_task
from config.celery import broadcast_task_status

logger = logging.getLogger(__name__)


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for clinical decision support reports.

    Endpoints:
    - POST /api/v1/reports/             -> Enqueue async report generation (returns 202 with task_id)
    - GET  /api/v1/reports/             -> List reports (filtered by user role)
    - GET  /api/v1/reports/{id}/        -> Report details & status
    - GET  /api/v1/reports/{id}/download/ -> Stream compiled PDF document
    """

    serializer_class = ReportSerializer
    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = Report.objects.select_related("patient", "prediction", "generated_by").order_by("-created_at")

        # Patients are restricted to their own medical reports
        if getattr(user, "is_patient", user.role == UserRole.PATIENT):
            qs = qs.filter(patient__user=user)

        # Query parameter filters
        patient_id = self.request.query_params.get("patient_id")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        report_status = self.request.query_params.get("status")
        if report_status:
            qs = qs.filter(status=report_status.upper())

        report_type = self.request.query_params.get("report_type")
        if report_type:
            qs = qs.filter(report_type=report_type.upper())

        return qs

    def create(self, request: Request, *args, **kwargs) -> Response:
        """
        Enqueue asynchronous report generation without blocking HTTP worker.
        Returns 202 ACCEPTED with task_id for tracking and status: QUEUED.
        """
        serializer = ReportCreateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Persist initial Report record in PENDING status
        report = Report.objects.create(
            patient_id=data["patient_id"],
            prediction_id=data.get("prediction_id"),
            generated_by=request.user,
            report_type=data.get("report_type", ReportType.RISK_ASSESSMENT),
            format=data.get("format", ReportFormat.PDF),
            parameters=data.get("parameters", {}),
            status=ReportStatus.PENDING,
        )

        # 2. Dispatch background Celery task
        task = generate_pdf_report_task.delay(
            report_id=str(report.id),
            requested_by_id=str(request.user.id),
        )

        # 3. Broadcast QUEUED status to WebSockets immediately
        broadcast_task_status(
            task_id=task.id,
            task_name="generate_pdf_report",
            status="QUEUED",
            progress=0,
            result={"report_id": str(report.id), "patient_id": str(report.patient_id)},
            recipient_user_id=str(request.user.id),
        )

        logger.info(
            "Report generation enqueued: report_id=%s task_id=%s patient_id=%s user=%s",
            report.id,
            task.id,
            report.patient_id,
            request.user.id,
        )

        response_data = {
            "task_id": task.id,
            "report_id": str(report.id),
            "status": "QUEUED",
            "message": "Report generation enqueued successfully.",
        }

        return Response(response_data, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request: Request, pk=None) -> FileResponse:
        """
        Stream the compiled PDF report file for download.
        """
        report = self.get_object()

        if report.status != ReportStatus.COMPLETED or not report.file_path:
            return Response(
                {
                    "error": "Report is not ready for download.",
                    "status": report.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_path = Path(report.file_path)
        if not file_path.exists():
            logger.error("Report file missing from disk: %s", report.file_path)
            raise Http404("Compiled report file not found on server.")

        filename = f"Clinical_Report_{report.patient.mrn}_{report.id}.pdf"
        return FileResponse(
            open(file_path, "rb"),
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )
