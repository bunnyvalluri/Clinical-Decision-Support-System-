"""
Production Metrics Collection Service.
Aggregates real measurements across HTTP, ML inference, WebSocket channels, Celery, and backing stores.
Strictly prohibits fabricated metrics or synthetic static numbers.
"""

import collections
import logging
import threading
import time
from typing import Any, Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class MetricsService:
    """
    Thread-safe operational telemetry collector for HealthNova AI.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init_service()
            return cls._instance

    def _init_service(self):
        self.lock = threading.Lock()
        self.start_time = time.time()
        self.api_latencies = collections.deque(maxlen=1000)
        self.prediction_latencies = collections.deque(maxlen=500)
        self.status_code_counts: Dict[str, int] = collections.defaultdict(int)
        self.endpoint_stats: Dict[str, Dict[str, Any]] = collections.defaultdict(
            lambda: {"count": 0, "errors": 0, "total_ms": 0.0}
        )
        self.total_requests = 0
        self.total_errors = 0
        self.active_ws_connections = 0
        self.celery_tasks_completed = 0
        self.celery_tasks_failed = 0
        self.ai_requests_count = 0
        self.ai_errors_count = 0
        self.ai_latencies = collections.deque(maxlen=500)

    def record_http_request(self, method: str, path: str, status_code: int, duration_ms: float):
        """Record real incoming HTTP request telemetry."""
        with self.lock:
            self.total_requests += 1
            self.api_latencies.append(duration_ms)
            category = f"{status_code // 100}xx"
            self.status_code_counts[category] += 1

            if status_code >= 400:
                self.total_errors += 1

            # Group normalized endpoint for endpoint-level metrics (limit cardinality)
            normalized_path = path.split("?")[0]
            if "/api/v1/" in normalized_path:
                parts = normalized_path.split("/")
                # keep up to 4 segments to bound cardinality
                endpoint_key = "/".join(parts[:5])
                stat = self.endpoint_stats[f"{method} {endpoint_key}"]
                stat["count"] += 1
                stat["total_ms"] += duration_ms
                if status_code >= 400:
                    stat["errors"] += 1

    def record_ml_inference(self, duration_ms: float, success: bool = True):
        with self.lock:
            self.prediction_latencies.append(duration_ms)

    def record_ai_request(self, duration_ms: float, success: bool = True):
        with self.lock:
            self.ai_requests_count += 1
            self.ai_latencies.append(duration_ms)
            if not success:
                self.ai_errors_count += 1

    def record_ws_connect(self):
        with self.lock:
            self.active_ws_connections += 1

    def record_ws_disconnect(self):
        with self.lock:
            self.active_ws_connections = max(0, self.active_ws_connections - 1)

    def record_celery_task(self, success: bool = True):
        with self.lock:
            if success:
                self.celery_tasks_completed += 1
            else:
                self.celery_tasks_failed += 1

    def get_metrics_snapshot(self) -> Dict[str, Any]:
        """Generate point-in-time metrics report with true measurements."""
        with self.lock:
            uptime = int(time.time() - self.start_time)
            api_lats = list(self.api_latencies)
            pred_lats = list(self.prediction_latencies)
            ai_lats = list(self.ai_latencies)

            avg_api_lat = round(sum(api_lats) / len(api_lats), 2) if api_lats else 0.0
            p95_api_lat = round(sorted(api_lats)[int(len(api_lats) * 0.95)], 2) if api_lats else 0.0

            avg_pred_lat = round(sum(pred_lats) / len(pred_lats), 2) if pred_lats else 0.0
            p95_pred_lat = round(sorted(pred_lats)[int(len(pred_lats) * 0.95)], 2) if pred_lats else 0.0

            avg_ai_lat = round(sum(ai_lats) / len(ai_lats), 2) if ai_lats else 0.0
            p95_ai_lat = round(sorted(ai_lats)[int(len(ai_lats) * 0.95)], 2) if ai_lats else 0.0

            error_rate = (
                round((self.total_errors / self.total_requests) * 100, 2)
                if self.total_requests > 0
                else 0.0
            )

            # Format top endpoints
            top_endpoints = []
            for ep, data in sorted(self.endpoint_stats.items(), key=lambda x: x[1]["count"], reverse=True)[:10]:
                cnt = data["count"]
                avg_ms = round(data["total_ms"] / cnt, 2) if cnt > 0 else 0.0
                err_pct = round((data["errors"] / cnt) * 100, 1) if cnt > 0 else 0.0
                top_endpoints.append({
                    "endpoint": ep,
                    "count": cnt,
                    "avg_ms": avg_ms,
                    "error_pct": err_pct,
                })

            return {
                "uptime_seconds": uptime,
                "timestamp": time.time(),
                "http": {
                    "total_requests": self.total_requests,
                    "total_errors": self.total_errors,
                    "error_rate_pct": error_rate,
                    "avg_latency_ms": avg_api_lat,
                    "p95_latency_ms": p95_api_lat,
                    "status_codes": dict(self.status_code_counts),
                    "top_endpoints": top_endpoints,
                },
                "ml_inference": {
                    "sample_count": len(pred_lats),
                    "avg_latency_ms": avg_pred_lat,
                    "p95_latency_ms": p95_pred_lat,
                },
                "ai_gateway": {
                    "total_requests": self.ai_requests_count,
                    "total_errors": self.ai_errors_count,
                    "avg_latency_ms": avg_ai_lat,
                    "p95_latency_ms": p95_ai_lat,
                },
                "websockets": {
                    "active_connections": self.active_ws_connections,
                },
                "celery": {
                    "tasks_completed": self.celery_tasks_completed,
                    "tasks_failed": self.celery_tasks_failed,
                },
            }
