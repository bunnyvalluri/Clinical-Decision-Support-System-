"""
Production-grade HTTP client for Google Jules REST API (v1alpha).
Communicates with https://jules.googleapis.com/v1alpha using X-Goog-Api-Key.
"""
import logging
from typing import Dict, Any, Optional, List
import requests
from integrations.jules.config import get_jules_settings
from integrations.jules.circuit_breaker import global_jules_circuit_breaker
from integrations.jules.exceptions import (
    JulesAuthenticationError,
    JulesAuthorizationError,
    JulesRateLimitError,
    JulesNotFoundError,
    JulesValidationError,
    JulesTimeoutError,
    JulesUnavailableError,
    JulesUnexpectedError,
)

logger = logging.getLogger("jules.client")


class JulesClient:
    """
    Client for the official Google Jules REST API.
    """
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        settings = get_jules_settings()
        self.api_key = api_key or settings.api_key
        self.base_url = (base_url or settings.base_url).rstrip("/")
        self.timeout = settings.timeout_seconds
        self.connect_timeout = settings.connect_timeout_seconds

    def _get_headers(self, correlation_id: Optional[str] = None) -> Dict[str, str]:
        if not self.api_key:
            raise JulesAuthenticationError("JULES_API_KEY is not configured in backend environment.")

        headers = {
            "X-Goog-Api-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "HealthNovaAI-JulesClient/1.0",
        }
        if correlation_id:
            headers["X-Correlation-ID"] = correlation_id
        return headers

    def _handle_response(self, response: requests.Response, endpoint: str) -> Dict[str, Any]:
        status = response.status_code
        if 200 <= status < 300:
            global_jules_circuit_breaker.record_success()
            if response.content:
                try:
                    return response.json()
                except Exception:
                    return {"raw": response.text}
            return {}

        global_jules_circuit_breaker.record_failure()
        try:
            error_data = response.json()
        except Exception:
            error_data = {"raw": response.text[:500]}

        msg = error_data.get("error", {}).get("message") or f"Jules API error on {endpoint}: HTTP {status}"

        if status == 401:
            raise JulesAuthenticationError(msg, details=error_data)
        elif status == 403:
            raise JulesAuthorizationError(msg, details=error_data)
        elif status == 404:
            raise JulesNotFoundError(msg, details=error_data)
        elif status == 429:
            retry_after = response.headers.get("Retry-After")
            raise JulesRateLimitError(
                msg, retry_after=int(retry_after) if retry_after and retry_after.isdigit() else None, details=error_data
            )
        elif 400 <= status < 500:
            raise JulesValidationError(msg, details=error_data)
        elif status >= 500:
            raise JulesUnavailableError(msg, details=error_data)
        else:
            raise JulesUnexpectedError(msg, details=error_data)

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        global_jules_circuit_breaker.check_or_raise()

        url = f"{self.base_url}/{path.lstrip('/')}"
        headers = self._get_headers(correlation_id)

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                timeout=(self.connect_timeout, self.timeout),
            )
            return self._handle_response(response, path)
        except requests.ConnectTimeout as e:
            global_jules_circuit_breaker.record_failure()
            logger.warning("Jules connection timeout on %s: %s", path, e)
            raise JulesTimeoutError(f"Connection timeout contacting Jules API: {e}") from e
        except requests.Timeout as e:
            global_jules_circuit_breaker.record_failure()
            logger.warning("Jules read timeout on %s: %s", path, e)
            raise JulesTimeoutError(f"Request timeout from Jules API: {e}") from e
        except requests.RequestException as e:
            global_jules_circuit_breaker.record_failure()
            logger.error("Jules network request error on %s: %s", path, e)
            raise JulesUnavailableError(f"Network error communicating with Jules API: {e}") from e

    # -------------------------------------------------------------------------
    # Sources API
    # -------------------------------------------------------------------------
    def list_sources(self, page_size: int = 20, page_token: Optional[str] = None) -> Dict[str, Any]:
        """Lists connected GitHub repository sources."""
        params = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        return self._request("GET", "sources", params=params)

    def get_source(self, source_name: str) -> Dict[str, Any]:
        """Gets metadata for a specific connected repository source."""
        clean_name = source_name.replace("sources/", "")
        return self._request("GET", f"sources/{clean_name}")

    # -------------------------------------------------------------------------
    # Sessions API
    # -------------------------------------------------------------------------
    def create_session(
        self,
        prompt: str,
        source_name: str,
        starting_branch: str = "develop",
        title: Optional[str] = None,
        require_plan_approval: bool = True,
        automation_mode: str = "NONE",
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates a new Jules remediation session."""
        payload = {
            "prompt": prompt,
            "sourceContext": {
                "source": source_name if source_name.startswith("sources/") else f"sources/{source_name}",
                "githubRepoContext": {
                    "startingBranch": starting_branch,
                },
            },
            "requirePlanApproval": require_plan_approval,
            "automationMode": automation_mode,
        }
        if title:
            payload["title"] = title

        return self._request("POST", "sessions", json_data=payload, correlation_id=correlation_id)

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """Retrieves session details by external session ID."""
        clean_id = session_id.replace("sessions/", "")
        return self._request("GET", f"sessions/{clean_id}")

    def list_sessions(self, page_size: int = 20, page_token: Optional[str] = None) -> Dict[str, Any]:
        """Lists active and past Jules sessions."""
        params = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        return self._request("GET", "sessions", params=params)

    def approve_plan(self, session_id: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """Approves a plan generated by Jules so execution can proceed."""
        clean_id = session_id.replace("sessions/", "")
        return self._request("POST", f"sessions/{clean_id}:approvePlan", json_data={}, correlation_id=correlation_id)

    def send_message(self, session_id: str, message: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """Sends developer feedback or instruction to an active Jules session."""
        clean_id = session_id.replace("sessions/", "")
        payload = {"message": message}
        return self._request("POST", f"sessions/{clean_id}:sendMessage", json_data=payload, correlation_id=correlation_id)

    # -------------------------------------------------------------------------
    # Activities API
    # -------------------------------------------------------------------------
    def list_activities(self, session_id: str, page_size: int = 50, page_token: Optional[str] = None) -> Dict[str, Any]:
        """Lists chronological activities within a session."""
        clean_id = session_id.replace("sessions/", "")
        params = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        return self._request("GET", f"sessions/{clean_id}/activities", params=params)
