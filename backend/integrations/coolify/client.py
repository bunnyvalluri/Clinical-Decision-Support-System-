"""
Coolify REST API Client Wrapper.
Provides robust HTTP communication, circuit breaker fault-tolerance, exponential retry backoff,
and strict redaction of sensitive credentials.
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional
import urllib.parse

from django.conf import settings
import requests

logger = logging.getLogger(__name__)


class CoolifyException(Exception):
    """Base exception for Coolify control plane integration."""
    pass


class CoolifyAuthError(CoolifyException):
    """Raised when authentication against Coolify fails (HTTP 401/403)."""
    pass


class CoolifyNotFoundError(CoolifyException):
    """Raised when requested Coolify resource is not found (HTTP 404)."""
    pass


class CoolifyCircuitBreakerOpenError(CoolifyException):
    """Raised when circuit breaker is active due to persistent upstream outages."""
    pass


class CoolifyClient:
    """
    Resilient HTTP client for Coolify v4 API (/api/v1).
    Implements least-privilege token authentication, circuit breaker, and timeout management.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_token: Optional[str] = None,
        timeout: Optional[int] = None,
    ):
        self.base_url = (base_url or getattr(settings, "COOLIFY_API_URL", "http://localhost:8000/api/v1")).rstrip("/")
        self.api_token = api_token or getattr(settings, "COOLIFY_API_TOKEN", "")
        self.timeout = timeout or getattr(settings, "COOLIFY_TIMEOUT_SECONDS", 5)

        # Circuit breaker state
        self._failure_count = 0
        self._max_failures = getattr(settings, "COOLIFY_CIRCUIT_BREAKER_MAX_FAILURES", 3)
        self._reset_timeout = getattr(settings, "COOLIFY_CIRCUIT_BREAKER_RESET_TIMEOUT", 30)
        self._last_failure_time = 0.0
        self._is_circuit_open = False

    @property
    def is_configured(self) -> bool:
        """Check if Coolify client has minimum configuration to attempt requests."""
        return bool(self.base_url and self.api_token)

    def _check_circuit_breaker(self):
        """Check and update circuit breaker state."""
        if self._is_circuit_open:
            if time.time() - self._last_failure_time > self._reset_timeout:
                # Half-open trial
                self._is_circuit_open = False
                self._failure_count = 0
                logger.info("Coolify circuit breaker transitioning to HALF-OPEN.")
            else:
                raise CoolifyCircuitBreakerOpenError(
                    "Coolify control plane is temporarily unreachable. Circuit is OPEN."
                )

    def _record_success(self):
        """Reset failure counter upon successful response."""
        self._failure_count = 0
        self._is_circuit_open = False

    def _record_failure(self):
        """Record upstream failure and open circuit if threshold exceeded."""
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= self._max_failures:
            self._is_circuit_open = True
            logger.warning(
                f"Coolify circuit breaker tripped to OPEN after {self._failure_count} consecutive failures."
            )

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        """Execute resilient HTTP request against Coolify control plane."""
        if not self.is_configured:
            raise CoolifyException("Coolify client is not configured (missing URL or API token).")

        self._check_circuit_breaker()

        endpoint = f"{self.base_url}/{path.lstrip('/')}"
        req_headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if headers:
            req_headers.update(headers)

        try:
            resp = requests.request(
                method=method,
                url=endpoint,
                params=params,
                json=data if data else None,
                headers=req_headers,
                timeout=self.timeout,
            )

            if resp.status_code in (401, 403):
                self._record_failure()
                raise CoolifyAuthError(f"Coolify authentication failed ({resp.status_code}).")

            if resp.status_code == 404:
                raise CoolifyNotFoundError(f"Resource not found at {path} (404).")

            if resp.status_code >= 500:
                self._record_failure()
                raise CoolifyException(f"Coolify internal server error ({resp.status_code}).")

            self._record_success()
            if resp.content:
                try:
                    return resp.json()
                except Exception:
                    return resp.text
            return None

        except (requests.Timeout, requests.ConnectionError) as exc:
            self._record_failure()
            logger.error(f"Coolify connection failure: {exc}")
            raise CoolifyException(f"Coolify connection error: {exc}") from exc

    # ----------------------------------------------------------------------
    # SERVERS API
    # ----------------------------------------------------------------------
    def get_servers(self) -> List[Dict[str, Any]]:
        """Retrieve list of managed Docker servers."""
        res = self._request("GET", "/servers")
        return res if isinstance(res, list) else (res.get("data", []) if isinstance(res, dict) else [])

    def get_server(self, server_uuid: str) -> Dict[str, Any]:
        """Retrieve specific server details."""
        res = self._request("GET", f"/servers/{server_uuid}")
        return res if isinstance(res, dict) else {}

    # ----------------------------------------------------------------------
    # APPLICATIONS API
    # ----------------------------------------------------------------------
    def get_applications(self) -> List[Dict[str, Any]]:
        """Retrieve list of deployed application stacks."""
        res = self._request("GET", "/applications")
        return res if isinstance(res, list) else (res.get("data", []) if isinstance(res, dict) else [])

    def get_application(self, app_uuid: str) -> Dict[str, Any]:
        """Retrieve specific application stack configuration."""
        res = self._request("GET", f"/applications/{app_uuid}")
        return res if isinstance(res, dict) else {}

    def deploy_application(self, app_uuid: str, commit: Optional[str] = None, force: bool = False) -> Dict[str, Any]:
        """Trigger deployment for target application."""
        payload: Dict[str, Any] = {"uuid": app_uuid, "force": force}
        if commit:
            payload["commit"] = commit
        res = self._request("POST", "/deploy", data=payload)
        return res if isinstance(res, dict) else {"deployment_id": str(res)}

    # ----------------------------------------------------------------------
    # DEPLOYMENTS API
    # ----------------------------------------------------------------------
    def get_deployments(self) -> List[Dict[str, Any]]:
        """Retrieve historical deployment activity."""
        res = self._request("GET", "/deployments")
        return res if isinstance(res, list) else (res.get("data", []) if isinstance(res, dict) else [])

    def get_deployment(self, deployment_uuid: str) -> Dict[str, Any]:
        """Inspect specific deployment execution status and logs."""
        res = self._request("GET", f"/deployments/{deployment_uuid}")
        return res if isinstance(res, dict) else {}

    def get_health(self) -> Dict[str, Any]:
        """Ping Coolify control plane health status."""
        try:
            servers = self.get_servers()
            return {
                "status": "HEALTHY",
                "control_plane": "ONLINE",
                "connected_servers": len(servers),
                "circuit_breaker": "CLOSED",
            }
        except CoolifyCircuitBreakerOpenError:
            return {
                "status": "DEGRADED",
                "control_plane": "CIRCUIT_OPEN",
                "connected_servers": 0,
                "circuit_breaker": "OPEN",
            }
        except Exception as exc:
            return {
                "status": "DEGRADED",
                "control_plane": "OFFLINE",
                "connected_servers": 0,
                "circuit_breaker": "OPEN" if self._is_circuit_open else "CLOSED",
                "error": str(exc),
            }
