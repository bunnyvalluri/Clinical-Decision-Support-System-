"""
Robust HTTP Client for Firecrawl REST API with Circuit Breaker and Exponential Backoff.
"""
import logging
import random
import time
from typing import Any, Dict, List, Optional
import requests

from .config import FirecrawlConfig
from .exceptions import FirecrawlUnavailableError, WebIntelligenceError

logger = logging.getLogger("apps.firecrawl")


class CircuitBreakerState:
    CLOSED = "CLOSED"      # Normal operation
    OPEN = "OPEN"          # Failing, fast-rejecting requests
    HALF_OPEN = "HALF_OPEN"# Testing if upstream has recovered


class CircuitBreaker:
    """
    In-memory Circuit Breaker to prevent cascading failures when Firecrawl is down.
    """
    def __init__(self, failure_threshold: int = 5, recovery_timeout_sec: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()

    def record_success(self) -> None:
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED

    def record_failure(self) -> None:
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            self.last_state_change = time.time()
            logger.warning(f"Firecrawl Circuit Breaker tripped to OPEN after {self.failure_count} failures.")

    def allow_request(self) -> bool:
        if self.state == CircuitBreakerState.CLOSED:
            return True
        if self.state == CircuitBreakerState.OPEN:
            # Check if recovery timeout has passed
            if time.time() - self.last_state_change > self.recovery_timeout_sec:
                self.state = CircuitBreakerState.HALF_OPEN
                self.last_state_change = time.time()
                logger.info("Firecrawl Circuit Breaker entering HALF_OPEN state.")
                return True
            return False
        if self.state == CircuitBreakerState.HALF_OPEN:
            return True
        return False


class FirecrawlClient:
    """
    Low-level REST client communicating with Firecrawl API instance.
    """

    def __init__(self, config: Optional[FirecrawlConfig] = None):
        self.config = config or FirecrawlConfig.load_from_settings()
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=self.config.circuit_fail_max,
            recovery_timeout_sec=self.config.circuit_reset_sec,
        )
        self.session = requests.Session()

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "HealthNova-CDSS-WebIntelligence/1.0",
        }
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        return headers

    def _execute_request(
        self,
        method: str,
        path: str,
        json_data: Optional[Dict[str, Any]] = None,
        timeout: Optional[int] = None,
        max_retries: int = 2,
    ) -> Dict[str, Any]:
        """
        Executes HTTP request with circuit breaker check and exponential backoff retry.
        """
        if not self.circuit_breaker.allow_request():
            raise FirecrawlUnavailableError("Firecrawl Circuit Breaker is OPEN. Service temporarily unavailable.")

        url = f"{self.config.base_url}{path}"
        req_timeout = timeout or self.config.request_timeout

        last_exception: Optional[Exception] = None
        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()
                response = self.session.request(
                    method=method,
                    url=url,
                    headers=self._get_headers(),
                    json=json_data,
                    timeout=req_timeout,
                )
                latency_ms = (time.time() - start_time) * 1000

                # Check for transient server errors eligible for retry
                if response.status_code in (502, 503, 504):
                    logger.warning(f"Firecrawl transient error {response.status_code} on {path}, attempt {attempt + 1}")
                    if attempt < max_retries:
                        sleep_time = (2 ** attempt) + random.uniform(0.1, 0.5)
                        time.sleep(sleep_time)
                        continue
                    else:
                        self.circuit_breaker.record_failure()
                        raise FirecrawlUnavailableError(f"Firecrawl returned transient error {response.status_code}")

                # Success
                if 200 <= response.status_code < 300:
                    self.circuit_breaker.record_success()
                    return response.json()

                # Client-side 4xx errors should not be retried
                error_body = response.text[:500]
                logger.error(f"Firecrawl API error {response.status_code} on {path}: {error_body}")
                raise WebIntelligenceError(
                    f"Firecrawl API returned status {response.status_code}: {error_body}",
                    code=f"HTTP_{response.status_code}",
                )

            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as ex:
                last_exception = ex
                logger.warning(f"Firecrawl connection/timeout on {path}, attempt {attempt + 1}: {ex}")
                if attempt < max_retries:
                    sleep_time = (2 ** attempt) + random.uniform(0.1, 0.5)
                    time.sleep(sleep_time)
                else:
                    self.circuit_breaker.record_failure()
                    raise FirecrawlUnavailableError(f"Firecrawl connection failed: {ex}") from ex

        self.circuit_breaker.record_failure()
        raise FirecrawlUnavailableError(f"Firecrawl request failed after {max_retries} retries: {last_exception}")

    # -------------------------------------------------------------------------
    # Core API Endpoints
    # -------------------------------------------------------------------------

    def health(self) -> Dict[str, Any]:
        """Checks Firecrawl API service health."""
        try:
            return self._execute_request("GET", "/health", timeout=self.config.connect_timeout, max_retries=1)
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def scrape(self, url: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Scrapes single URL via /v1/scrape."""
        payload: Dict[str, Any] = {"url": url}
        if options:
            payload.update(options)
        return self._execute_request("POST", "/v1/scrape", json_data=payload)

    def map_url(self, url: str, search: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
        """Maps website links via /v1/map."""
        payload: Dict[str, Any] = {"url": url, "limit": limit}
        if search:
            payload["search"] = search
        return self._execute_request("POST", "/v1/map", json_data=payload)

    def crawl(self, url: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Starts asynchronous crawl job via /v1/crawl."""
        payload: Dict[str, Any] = {"url": url}
        if options:
            payload.update(options)
        return self._execute_request("POST", "/v1/crawl", json_data=payload)

    def get_crawl_status(self, crawl_id: str) -> Dict[str, Any]:
        """Fetches status of crawl job via /v1/crawl/{id}."""
        return self._execute_request("GET", f"/v1/crawl/{crawl_id}")

    def cancel_crawl(self, crawl_id: str) -> Dict[str, Any]:
        """Cancels crawl job via DELETE /v1/crawl/{id}."""
        return self._execute_request("DELETE", f"/v1/crawl/{crawl_id}")

    def batch_scrape(self, urls: List[str], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Starts batch scraping job via /v1/batch/scrape."""
        payload: Dict[str, Any] = {"urls": urls}
        if options:
            payload.update(options)
        return self._execute_request("POST", "/v1/batch/scrape", json_data=payload)

    def search(self, query: str, limit: int = 10, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Searches the web via /v1/search."""
        payload: Dict[str, Any] = {"query": query, "limit": limit}
        if options:
            payload["scrapeOptions"] = options
        return self._execute_request("POST", "/v1/search", json_data=payload)

    def extract(self, urls: List[str], schema: Dict[str, Any], prompt: Optional[str] = None) -> Dict[str, Any]:
        """Extracts structured JSON conforming to schema via /v1/extract."""
        payload: Dict[str, Any] = {"urls": urls, "schema": schema}
        if prompt:
            payload["prompt"] = prompt
        return self._execute_request("POST", "/v1/extract", json_data=payload)
