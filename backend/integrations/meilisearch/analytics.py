"""
Search Analytics Service.
Provides aggregated search quality metrics without tracking individual clinician queries.
"""
from typing import Any, Dict
from django.db.models import Avg, Count
from django.utils import timezone
from datetime import timedelta


class SearchAnalyticsService:
    """Aggregated search quality and performance telemetry."""

    @classmethod
    def get_metrics_summary(cls, hours: int = 24) -> Dict[str, Any]:
        """Compute aggregated search statistics for the specified timeframe."""
        since = timezone.now() - timedelta(hours=hours)
        try:
            from apps.search.models import SearchAuditEvent
            qs = SearchAuditEvent.objects.filter(timestamp__gte=since)
            total_searches = qs.count()

            if total_searches == 0:
                return {
                    "total_searches": 0,
                    "avg_latency_ms": 0.0,
                    "zero_result_rate": 0.0,
                    "degraded_mode_rate": 0.0,
                    "searches_by_index": {},
                }

            avg_latency = qs.aggregate(Avg("latency_ms"))["latency_ms__avg"] or 0.0
            zero_results = qs.filter(result_count=0).count()
            degraded_count = qs.filter(search_mode="degraded_postgres").count()

            by_index = {}
            for item in qs.values("index_name").annotate(count=Count("id")):
                by_index[item["index_name"]] = item["count"]

            return {
                "total_searches": total_searches,
                "avg_latency_ms": round(avg_latency, 2),
                "zero_result_rate": round(zero_results / total_searches, 4),
                "degraded_mode_rate": round(degraded_count / total_searches, 4),
                "searches_by_index": by_index,
            }
        except Exception:
            return {
                "total_searches": 0,
                "avg_latency_ms": 0.0,
                "zero_result_rate": 0.0,
                "degraded_mode_rate": 0.0,
                "searches_by_index": {},
            }
