"""
Views for Security Testing & DevSecOps API.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.security_testing.models import (
    SecurityTarget,
    SecurityScan,
    SecurityFinding,
    SecurityReport,
    SecurityAuditEvent,
    SecurityToolExecution,
    ApprovalStatus,
    SecurityScanState,
    FindingState,
)
from apps.security_testing.serializers import (
    SecurityTargetSerializer,
    SecurityScanSerializer,
    SecurityFindingSerializer,
    SecurityReportSerializer,
    SecurityAuditEventSerializer,
    SecurityRetestSerializer,
    SecurityToolExecutionSerializer,
)
from apps.security_testing.permissions import (
    CanManageSecurityTargets,
    CanManageSecurityScans,
    CanViewSecurityFindings,
    CanValidateFindings,
)
from apps.security_testing.services.orchestrator import SecurityOrchestrator
from apps.security_testing.services.validation_gate import FindingValidationService
from apps.security_testing.services.retest import SecurityRetestService


class SecurityTargetViewSet(viewsets.ModelViewSet):
    queryset = SecurityTarget.objects.all()
    serializer_class = SecurityTargetSerializer
    permission_classes = [IsAuthenticated, CanManageSecurityTargets]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        target = self.get_object()
        target.approval_status = ApprovalStatus.APPROVED
        target.approved_by = request.user
        target.approval_expires_at = timezone.now() + timezone.timedelta(days=7)
        target.save(update_fields=["approval_status", "approved_by", "approval_expires_at", "updated_at"])

        SecurityAuditEvent.objects.create(
            event_type="TARGET_APPROVED",
            actor=request.user,
            target_name=target.name,
            details={"approved_by": request.user.username, "expires_at": str(target.approval_expires_at)},
        )
        return Response(SecurityTargetSerializer(target).data)


class SecurityScanViewSet(viewsets.ModelViewSet):
    queryset = SecurityScan.objects.all().select_related("target", "initiated_by")
    serializer_class = SecurityScanSerializer
    permission_classes = [IsAuthenticated, CanManageSecurityScans]

    def perform_create(self, serializer):
        serializer.save(initiated_by=self.request.user)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        scan = self.get_object()
        updated_scan = SecurityOrchestrator.start_scan(str(scan.id), actor=request.user)
        return Response(SecurityScanSerializer(updated_scan).data)

    @action(detail=True, methods=["post"])
    def emergency_stop(self, request, pk=None):
        scan = self.get_object()
        reason = request.data.get("reason", "Administrative emergency stop")
        SecurityOrchestrator.trigger_emergency_stop(str(scan.id), actor=request.user, reason=reason)
        scan.refresh_from_db()
        return Response(SecurityScanSerializer(scan).data)


class SecurityFindingViewSet(viewsets.ModelViewSet):
    queryset = SecurityFinding.objects.all().select_related("target", "scan", "assigned_to")
    serializer_class = SecurityFindingSerializer
    permission_classes = [IsAuthenticated, CanViewSecurityFindings]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanValidateFindings])
    def validate_gate(self, request, pk=None):
        finding = self.get_object()
        notes = request.data.get("notes", "")
        passed, validation = FindingValidationService.evaluate_finding(
            finding=finding,
            validator_user=request.user,
            validation_notes=notes,
        )
        finding.refresh_from_db()
        return Response({
            "passed": passed,
            "decision": validation.decision,
            "finding": SecurityFindingSerializer(finding).data,
        })

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanValidateFindings])
    def retest(self, request, pk=None):
        finding = self.get_object()
        retest_result = SecurityRetestService.execute_retest(finding, tester_user=request.user)
        return Response(SecurityRetestSerializer(retest_result).data)


class SecurityReportViewSet(viewsets.ModelViewSet):
    queryset = SecurityReport.objects.all().select_related("scan", "generated_by", "reviewed_by")
    serializer_class = SecurityReportSerializer
    permission_classes = [IsAuthenticated, CanViewSecurityFindings]

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanManageSecurityScans])
    def approve(self, request, pk=None):
        report = self.get_object()
        report.is_approved = True
        report.reviewed_by = request.user
        report.approved_at = timezone.now()
        report.save(update_fields=["is_approved", "reviewed_by", "approved_at", "updated_at"])
        return Response(SecurityReportSerializer(report).data)


class SecurityAuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SecurityAuditEvent.objects.all().select_related("actor")
    serializer_class = SecurityAuditEventSerializer
    permission_classes = [IsAuthenticated, CanViewSecurityFindings]


class SecurityToolInventoryView(APIView):
    permission_classes = [IsAuthenticated, CanViewSecurityFindings]

    def get(self, request):
        tools = [
            {
                "name": "Agentic-Bug-Hunter-Core",
                "version": "3.42.0",
                "purpose": "Controlled DevSecOps security orchestration and vulnerability validation",
                "network_access": "Authorized target scope only (default-deny)",
                "risk_level": "LOW (Defensive simulation only)",
                "status": "ACTIVE",
            },
            {
                "name": "ValidationGate-7Q",
                "version": "1.2.0",
                "purpose": "7-Question deterministic vulnerability filtering",
                "network_access": "None (In-process evaluation)",
                "risk_level": "NONE",
                "status": "ACTIVE",
            },
            {
                "name": "SecretRedactionEngine",
                "version": "2.0.0",
                "purpose": "Automatic regex and AST redaction of JWTs, keys, and patient PHI",
                "network_access": "None (In-process evaluation)",
                "risk_level": "NONE",
                "status": "ACTIVE",
            },
            {
                "name": "SyntheticTestDataGenerator",
                "version": "1.0.0",
                "purpose": "Synthetic patient records and non-production credential simulation",
                "network_access": "None",
                "risk_level": "NONE",
                "status": "ACTIVE",
            },
        ]
        return Response({"tools": tools, "pinned_at": "2026-09-15T00:00:00Z"})


class SecurityMetricsView(APIView):
    """
    Returns REAL security metrics derived exclusively from database records.
    Zero fake or hardcoded numbers!
    """
    permission_classes = [IsAuthenticated, CanViewSecurityFindings]

    def get(self, request):
        total_targets = SecurityTarget.objects.count()
        approved_targets = SecurityTarget.objects.filter(approval_status=ApprovalStatus.APPROVED, is_active=True).count()
        total_scans = SecurityScan.objects.count()
        completed_scans = SecurityScan.objects.filter(status=SecurityScanState.COMPLETED).count()

        total_findings = SecurityFinding.objects.count()
        validated_findings = SecurityFinding.objects.filter(state=FindingState.VALIDATED).count()
        resolved_findings = SecurityFinding.objects.filter(state=FindingState.RESOLVED).count()
        false_positives = SecurityFinding.objects.filter(state=FindingState.FALSE_POSITIVE).count()

        critical_count = SecurityFinding.objects.filter(severity="CRITICAL", state=FindingState.VALIDATED).count()
        high_count = SecurityFinding.objects.filter(severity="HIGH", state=FindingState.VALIDATED).count()
        medium_count = SecurityFinding.objects.filter(severity="MEDIUM", state=FindingState.VALIDATED).count()
        low_count = SecurityFinding.objects.filter(severity="LOW", state=FindingState.VALIDATED).count()

        return Response({
            "total_targets": total_targets,
            "approved_targets": approved_targets,
            "total_scans": total_scans,
            "completed_scans": completed_scans,
            "total_findings": total_findings,
            "validated_findings": validated_findings,
            "resolved_findings": resolved_findings,
            "false_positives": false_positives,
            "by_severity": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
            },
            "has_executed_scans": total_scans > 0,
        })
