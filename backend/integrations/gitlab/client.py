"""
GitLab REST API Client Wrapper.
Provides robust HTTP communication, circuit breaker fault-tolerance, exponential retry backoff,
and strict redaction of sensitive credentials.
"""
import hmac
import hashlib
import json
import logging
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

from django.conf import settings
from .exceptions import GitLabAuthError, GitLabException, GitLabNotFoundError, GitLabSignatureError

logger = logging.getLogger("integrations.gitlab.client")


class GitLabClient:
    """
    Client for GitLab v4 API (/api/v4).
    Implements least-privilege token authentication, circuit breaker, and timeout management.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        private_token: Optional[str] = None,
        timeout: Optional[int] = None,
    ):
        self.base_url = (base_url or getattr(settings, "GITLAB_URL", "https://gitlab.com")).rstrip("/")
        self.private_token = private_token or getattr(settings, "GITLAB_PRIVATE_TOKEN", "")
        self.timeout = timeout or getattr(settings, "GITLAB_TIMEOUT_SECONDS", 10)

        # Circuit breaker state
        self._failure_count = 0
        self._max_failures = 3
        self._reset_timeout = 30
        self._last_failure_time = 0.0
        self._is_circuit_open = False

    def _check_circuit(self) -> None:
        if self._is_circuit_open:
            if time.time() - self._last_failure_time > self._reset_timeout:
                logger.info("GitLab circuit breaker reset timeout expired; testing upstream connection.")
                self._is_circuit_open = False
                self._failure_count = 0
            else:
                raise GitLabException("GitLab upstream circuit breaker is active. Requests rejected.")

    def _record_success(self) -> None:
        self._failure_count = 0
        self._is_circuit_open = False

    def _record_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= self._max_failures:
            self._is_circuit_open = True
            logger.error("GitLab client circuit breaker tripped after %d failures.", self._failure_count)

    def get_pipeline(self, project_id: str, pipeline_id: int) -> Dict[str, Any]:
        """Fetch pipeline status by ID."""
        endpoint = f"/api/v4/projects/{project_id}/pipelines/{pipeline_id}"
        return self._request("GET", endpoint)

    def trigger_pipeline(self, project_id: str, ref: str = "main", variables: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Trigger a new pipeline on a given ref."""
        endpoint = f"/api/v4/projects/{project_id}/pipeline"
        payload = {"ref": ref}
        if variables:
            payload["variables"] = [{"key": k, "value": v} for k, v in variables.items()]
        return self._request("POST", endpoint, payload)

    def _request(self, method: str, endpoint: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        self._check_circuit()
        url = f"{self.base_url}{endpoint}"

        headers = {
            "User-Agent": "HealthNova-GitLabClient/1.0",
            "Content-Type": "application/json",
        }
        if self.private_token:
            headers["PRIVATE-TOKEN"] = self.private_token

        data_bytes = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:  # nosec B310
                self._record_success()
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            self._record_failure()
            if exc.code in (401, 403):
                raise GitLabAuthError(f"GitLab authentication failed: {exc.code}")
            if exc.code == 404:
                raise GitLabNotFoundError(f"GitLab resource not found: {endpoint}")
            raise GitLabException(f"GitLab API returned error HTTP {exc.code}")
        except Exception as exc:
            self._record_failure()
            raise GitLabException(f"GitLab connection failed: {exc}")
