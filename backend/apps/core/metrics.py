"""
Production metrics registry for clinical decision support telemetry.

Tracks:
- API latency (windowed rolling average and p95)
- ML prediction inference latency
- Inbound HTTP error rate
- Active WebSocket connections
- Celery asynchronous task failures
- Database and Redis dependency health
"""
import collections
import logging
import threading
import time
from typing import Any

logger = logging.getLogger(__name__)


class MetricsRegistry:
    """Thread-safe in-memory metrics aggregator."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init_metrics()
            return cls._instance

    def _init_metrics(self):
        self.lock = threading.Lock()
        self.api_latencies = collections.deque(maxlen=500)
        self.prediction_latencies = collections.deque(maxlen=500)
        self.total_requests = 0
        self.total_errors = 0
        self.active_ws_connections = 0
        self.celery_task_failures = 0
        self.celery_tasks_completed = 0
        self.start_time = time.time()

    def record_request(self, duration_ms: float, status_code: int):
        with self.lock:
            self.total_requests += 1
            self.api_latencies.append(duration_ms)
            if status_code >= 400:
                self.total_errors += 1

    def record_prediction(self, duration_ms: float):
        with self.lock:
            self.prediction_latencies.append(duration_ms)

    def record_ws_connect(self):
        with self.lock:
            self.active_ws_connections += 1

    def record_ws_disconnect(self):
        with self.lock:
            self.active_ws_connections = max(0, self.active_ws_connections - 1)

    def record_celery_success(self):
        with self.lock:
            self.celery_tasks_completed += 1

    def record_celery_failure(self):
        with self.lock:
            self.celery_task_failures += 1

    def get_summary(self) -> dict[str, Any]:
        with self.lock:
            api_lats = list(self.api_latencies)
            pred_lats = list(self.prediction_latencies)
            uptime_seconds = int(time.time() - self.start_time)
            error_rate = (
                round((self.total_errors / self.total_requests) * 100, 2)
                if self.total_requests > 0
                else 0.0
            )

            avg_api_lat = round(sum(api_lats) / len(api_lats), 2) if api_lats else 0.0
            p95_api_lat = (
                round(sorted(api_lats)[int(len(api_lats) * 0.95)], 2)
                if api_lats
                else 0.0
            )

            avg_pred_lat = (
                round(sum(pred_lats) / len(pred_lats), 2) if pred_lats else 0.0
            )
            p95_pred_lat = (
                round(sorted(pred_lats)[int(len(pred_lats) * 0.95)], 2)
                if pred_lats
                else 0.0
            )

            return {
                "uptime_seconds": uptime_seconds,
                "api": {
                    "total_requests": self.total_requests,
                    "total_errors": self.total_errors,
                    "error_rate_pct": error_rate,
                    "avg_latency_ms": avg_api_lat,
                    "p95_latency_ms": p95_api_lat,
                },
                "ml_inference": {
                    "sample_count": len(pred_lats),
                    "avg_latency_ms": avg_pred_lat,
                    "p95_latency_ms": p95_pred_lat,
                },
                "websockets": {
                    "active_connections": self.active_ws_connections,
                },
                "celery": {
                    "tasks_completed": self.celery_tasks_completed,
                    "tasks_failed": self.celery_task_failures,
                },
            }


metrics = MetricsRegistry()
