"""
Interoperability Repositories — BPY-CSE-2666.
Encapsulates data access and aggregate queries for telemetry and dashboards.
"""
from typing import Any, Dict, List
from django.db.models import Count, Q
from django.utils import timezone

from apps.interoperability.domain.enums import ConflictStatus, SyncStatus
from apps.interoperability.models import (
    FHIREndpoint,
    FHIRMappingConflict,
    FHIRProvenanceRecord,
    FHIRSyncJob,
)


class InteroperabilityRepository:
    """
    Data access layer for interoperability dashboards, telemetry, and reporting.
    """

    @classmethod
    def get_dashboard_metrics(cls) -> Dict[str, Any]:
        """Aggregate telemetry metrics for admin and informaticist views."""
        total_endpoints = FHIREndpoint.objects.count()
        active_endpoints = FHIREndpoint.objects.filter(is_active=True).count()

        pending_conflicts = FHIRMappingConflict.objects.filter(
            status=ConflictStatus.PENDING_REVIEW
        ).count()

        recent_jobs = FHIRSyncJob.objects.order_by("-created_at")[:10]
        total_jobs = FHIRSyncJob.objects.count()
        successful_jobs = FHIRSyncJob.objects.filter(
            status__in=[SyncStatus.COMPLETED, SyncStatus.PARTIAL_SUCCESS]
        ).count()

        success_rate = (successful_jobs / total_jobs * 100.0) if total_jobs > 0 else 100.0

        total_provenance_records = FHIRProvenanceRecord.objects.count()

        return {
            "total_endpoints": total_endpoints,
            "active_endpoints": active_endpoints,
            "pending_conflicts": pending_conflicts,
            "total_sync_jobs": total_jobs,
            "success_rate_percent": round(success_rate, 1),
            "total_provenance_records": total_provenance_records,
            "recent_jobs": [
                {
                    "id": str(j.id),
                    "endpoint_name": j.endpoint.name if j.endpoint else "Direct / Manual",
                    "direction": j.direction,
                    "status": j.status,
                    "total_records": j.total_records,
                    "imported_records": j.imported_records,
                    "conflicts_generated": j.conflicts_generated,
                    "duration_ms": float(j.duration_ms),
                    "created_at": j.created_at.isoformat(),
                }
                for j in recent_jobs
            ],
        }
