"""
Telemetry and Health Metrics Tracker for Firecrawl Web Intelligence.
Records actual operational statistics without fabrication.
"""
from dataclasses import dataclass, field
import threading
import time
from typing import Any, Dict


@dataclass
class TelemetryStats:
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_latency_ms: float = 0.0
    ssrf_blocks: int = 0
    domain_blocks: int = 0
    rate_limit_blocks: int = 0
    pages_crawled: int = 0
    pages_scraped: int = 0
    last_success_timestamp: float = 0.0
    last_failure_timestamp: float = 0.0
    last_error_message: str = ""


class FirecrawlTelemetry:
    """
    Thread-safe operational telemetry collector for web intelligence.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._stats = TelemetryStats()
                cls._instance._stats_lock = threading.Lock()
            return cls._instance

    def record_request(self, duration_ms: float, success: bool, error: str = "") -> None:
        with self._stats_lock:
            self._stats.total_requests += 1
            self._stats.total_latency_ms += duration_ms
            if success:
                self._stats.successful_requests += 1
                self._stats.last_success_timestamp = time.time()
            else:
                self._stats.failed_requests += 1
                self._stats.last_failure_timestamp = time.time()
                self._stats.last_error_message = error

    def record_ssrf_block(self) -> None:
        with self._stats_lock:
            self._stats.ssrf_blocks += 1

    def record_domain_block(self) -> None:
        with self._stats_lock:
            self._stats.domain_blocks += 1

    def record_rate_limit(self) -> None:
        with self._stats_lock:
            self._stats.rate_limit_blocks += 1

    def record_pages_crawled(self, count: int) -> None:
        with self._stats_lock:
            self._stats.pages_crawled += count

    def record_page_scraped(self) -> None:
        with self._stats_lock:
            self._stats.pages_scraped += 1

    def get_metrics(self) -> Dict[str, Any]:
        """Returns snapshot of actual telemetry metrics."""
        with self._stats_lock:
            avg_latency = (
                round(self._stats.total_latency_ms / self._stats.total_requests, 2)
                if self._stats.total_requests > 0
                else 0.0
            )
            return {
                "total_requests": self._stats.total_requests,
                "successful_requests": self._stats.successful_requests,
                "failed_requests": self._stats.failed_requests,
                "average_latency_ms": avg_latency,
                "ssrf_blocks": self._stats.ssrf_blocks,
                "domain_blocks": self._stats.domain_blocks,
                "rate_limit_blocks": self._stats.rate_limit_blocks,
                "pages_crawled": self._stats.pages_crawled,
                "pages_scraped": self._stats.pages_scraped,
                "last_success_timestamp": self._stats.last_success_timestamp,
                "last_failure_timestamp": self._stats.last_failure_timestamp,
                "last_error_message": self._stats.last_error_message,
            }
