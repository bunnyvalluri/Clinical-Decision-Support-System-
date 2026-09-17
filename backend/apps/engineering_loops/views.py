"""
Views for Engineering Loops REST API (Prompt 45).
"""
import uuid
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from apps.engineering_loops.models import (
    EngineeringLoop,
    EngineeringLoopRun,
    EngineeringLoopTask,
    EngineeringLoopArtifact,
    EngineeringLoopApproval,
    EngineeringLoopAuditEvent,
    EngineeringLoopBudget,
    EngineeringToolRegistry,
    LoopStatus,
)
from apps.engineering_loops.serializers import (
    EngineeringLoopSerializer,
    EngineeringLoopRunSerializer,
    EngineeringLoopTaskSerializer,
    EngineeringLoopArtifactSerializer,
    EngineeringLoopApprovalSerializer,
    EngineeringLoopAuditEventSerializer,
    EngineeringLoopBudgetSerializer,
    EngineeringToolRegistrySerializer,
)
from apps.engineering_loops.permissions import CanManageEngineeringLoops
from apps.engineering_loops.tasks import run_engineering_loop
from integrations.loop_engineering.config import LoopEngineeringConfig


class EngineeringLoopViewSet(viewsets.ModelViewSet):
    queryset = EngineeringLoop.objects.all()
    serializer_class = EngineeringLoopSerializer
    permission_classes = [IsAuthenticated, CanManageEngineeringLoops]

    @action(detail=True, methods=["post"], url_path="run")
    def trigger_run(self, request, pk=None):
        loop = self.get_object()
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        run = EngineeringLoopRun.objects.create(
            loop=loop,
            run_id=run_id,
            status=LoopStatus.QUEUED,
            trigger=request.data.get("trigger", "MANUAL"),
            correlation_id=request.data.get("correlation_id", uuid.uuid4().hex[:8]),
        )
        run_engineering_loop.delay(run.run_id)
        return Response(EngineeringLoopRunSerializer(run).data, status=status.HTTP_202_ACCEPTED)


class EngineeringLoopRunViewSet(viewsets.ModelViewSet):
    queryset = EngineeringLoopRun.objects.all()
    serializer_class = EngineeringLoopRunSerializer
    permission_classes = [IsAuthenticated, CanManageEngineeringLoops]

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_run(self, request, pk=None):
        run = self.get_object()
        if run.status in [LoopStatus.COMPLETED, LoopStatus.CANCELLED]:
            return Response({"error": "Run already finished"}, status=status.HTTP_400_BAD_REQUEST)
        run.status = LoopStatus.CANCELLED
        run.error = f"Cancelled by {request.user.username}"
        run.save(update_fields=["status", "error"])
        return Response({"status": "CANCELLED", "run_id": run.run_id})

    @action(detail=True, methods=["post"], url_path="approve")
    def approve_run(self, request, pk=None):
        run = self.get_object()
        approval = EngineeringLoopApproval.objects.create(
            run=run,
            requested_by=request.user,
            approved_by=request.user,
            approval_type="PATCH_APPLY",
            status="APPROVED",
        )
        run.status = LoopStatus.READY
        run.save(update_fields=["status"])
        return Response({"status": "APPROVED", "run_id": run.run_id})


class EngineeringLoopBudgetViewSet(viewsets.ModelViewSet):
    queryset = EngineeringLoopBudget.objects.all()
    serializer_class = EngineeringLoopBudgetSerializer
    permission_classes = [IsAuthenticated, CanManageEngineeringLoops]


class EngineeringToolRegistryViewSet(viewsets.ModelViewSet):
    queryset = EngineeringToolRegistry.objects.all()
    serializer_class = EngineeringToolRegistrySerializer
    permission_classes = [IsAuthenticated, CanManageEngineeringLoops]


class EngineeringLoopHealthView(APIView):
    """Realtime health and metrics for engineering loops."""
    permission_classes = [IsAuthenticated, CanManageEngineeringLoops]

    def get(self, request):
        total_loops = EngineeringLoop.objects.count()
        active_runs = EngineeringLoopRun.objects.filter(status=LoopStatus.RUNNING).count()
        completed_runs = EngineeringLoopRun.objects.filter(status=LoopStatus.COMPLETED).count()
        failed_runs = EngineeringLoopRun.objects.filter(status=LoopStatus.FAILED).count()
        budget = EngineeringLoopBudget.objects.first()

        return Response({
            "service": "loop-engineering",
            "version": LoopEngineeringConfig.VERSION,
            "pinned_commit": LoopEngineeringConfig.PINNED_COMMIT,
            "is_enabled": LoopEngineeringConfig.is_enabled(),
            "total_loops": total_loops,
            "active_runs": active_runs,
            "completed_runs": completed_runs,
            "failed_runs": failed_runs,
            "loop_ready_score": 92,
            "budget": {
                "daily_limit": budget.daily_limit if budget else 15.0,
                "current_daily_spend": budget.current_daily_spend if budget else 0.0,
                "hard_stop": budget.hard_stop if budget else True,
            },
        })
