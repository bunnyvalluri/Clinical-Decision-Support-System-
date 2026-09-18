"""
Resilient Ollama API Client with Circuit Breaker, Exponential Backoff,
and Native / OpenAI-compatible endpoint support.
"""
import json
import logging
import time
import urllib.error
import urllib.request
from enum import Enum
from typing import Any, Dict, Generator, List, Optional
import uuid

from .config import ollama_settings
from .exceptions import (
    CircuitBreakerOpenError,
    ModelNotFoundError,
    OllamaConnectionError,
    OllamaError,
    OllamaTimeoutError,
)

logger = logging.getLogger("integrations.ollama.client")


class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """State-machine Circuit Breaker to prevent cascading failures to Ollama."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_failure_time = 0.0

    def check(self) -> None:
        now = time.time()
        if self.state == CircuitState.OPEN:
            if now - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                logger.info("Ollama circuit breaker transitioned to HALF_OPEN")
            else:
                remaining = int(self.recovery_timeout - (now - self.last_failure_time))
                raise CircuitBreakerOpenError(
                    f"Ollama circuit breaker is OPEN. Fast-failing requests ({remaining}s remaining)."
                )

    def record_success(self) -> None:
        if self.state in (CircuitState.HALF_OPEN, CircuitState.OPEN):
            logger.info("Ollama circuit breaker recovered; transitioned to CLOSED")
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error("Ollama circuit breaker tripped to OPEN after %s consecutive failures", self.failure_count)


class OllamaClient:
    """
    Robust HTTP client for communication with local Ollama daemon.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[int] = None,
        connect_timeout: Optional[int] = None,
    ):
        self.base_url = (base_url or ollama_settings.base_url).rstrip("/")
        self.timeout = timeout or ollama_settings.request_timeout
        self.connect_timeout = connect_timeout or ollama_settings.connect_timeout
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=ollama_settings.circuit_breaker_threshold,
            recovery_timeout=ollama_settings.circuit_breaker_recovery_seconds,
        )

    def _request(
        self,
        endpoint: str,
        method: str = "GET",
        payload: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
        timeout: Optional[int] = None,
        stream: bool = False,
    ) -> Any:
        self.circuit_breaker.check()
        cid = correlation_id or str(uuid.uuid4())
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "HealthNova-CDSS/3.42.0 (OllamaClient)",
            "X-Correlation-ID": cid,
        }
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        req_timeout = timeout or self.timeout

        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                resp = urllib.request.urlopen(req, timeout=req_timeout)  # nosec B310
                self.circuit_breaker.record_success()
                if stream:
                    return resp
                data = json.loads(resp.read().decode("utf-8"))
                return data
            except urllib.error.HTTPError as he:
                self.circuit_breaker.record_failure()
                err_msg = ""
                try:
                    err_msg = he.read().decode("utf-8")
                except Exception:
                    pass
                if he.code == 404:
                    raise ModelNotFoundError(f"Requested resource or model not found on Ollama: {err_msg or str(he)}")
                raise OllamaError(f"Ollama HTTP {he.code}: {err_msg or str(he)}")
            except (urllib.error.URLError, TimeoutError) as ue:
                if attempt < max_retries:
                    backoff = 0.5 * (2 ** attempt)
                    time.sleep(backoff)
                    continue
                self.circuit_breaker.record_failure()
                if "timed out" in str(ue).lower():
                    raise OllamaTimeoutError(f"Ollama request to {endpoint} timed out after {req_timeout}s: {ue}")
                raise OllamaConnectionError(f"Could not connect to Ollama daemon at {self.base_url}: {ue}")
            except Exception as e:
                self.circuit_breaker.record_failure()
                raise OllamaError(f"Unexpected Ollama client error: {e}")

    # --- API Endpoints ---

    def list_models(self) -> List[Dict[str, Any]]:
        """GET /api/tags: List all downloaded models."""
        resp = self._request("/api/tags", method="GET")
        return resp.get("models", [])

    def show_model(self, model_name: str) -> Dict[str, Any]:
        """POST /api/show: Return detailed architecture and modelfile."""
        return self._request("/api/show", method="POST", payload={"name": model_name})

    def running_models(self) -> List[Dict[str, Any]]:
        """GET /api/ps: List currently running models in VRAM/RAM."""
        resp = self._request("/api/ps", method="GET")
        return resp.get("models", [])

    def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        format_json: bool = False,
        stream: bool = False,
        keep_alive: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """POST /api/generate: Generate completion."""
        payload: Dict[str, Any] = {
            "model": model or ollama_settings.default_chat_model,
            "prompt": prompt,
            "stream": stream,
            "keep_alive": keep_alive or ollama_settings.keep_alive,
        }
        if system:
            payload["system"] = system
        if format_json:
            payload["format"] = "json"
        
        opts = {
            "temperature": ollama_settings.default_temperature,
            "seed": ollama_settings.default_seed,
        }
        if options:
            opts.update(options)
        payload["options"] = opts

        return self._request("/api/generate", method="POST", payload=payload, correlation_id=correlation_id)

    def generate_stream(
        self,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> Generator[str, None, None]:
        """Streaming generator yielding text chunks."""
        payload: Dict[str, Any] = {
            "model": model or ollama_settings.default_chat_model,
            "prompt": prompt,
            "stream": True,
            "keep_alive": ollama_settings.keep_alive,
        }
        if system:
            payload["system"] = system
        if options:
            payload["options"] = options

        resp = self._request("/api/generate", method="POST", payload=payload, correlation_id=correlation_id, stream=True)
        try:
            for line in resp:
                if line:
                    chunk = json.loads(line.decode("utf-8"))
                    yield chunk.get("response", "")
                    if chunk.get("done", False):
                        break
        finally:
            resp.close()

    def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        format_json: bool = False,
        stream: bool = False,
        keep_alive: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """POST /api/chat: Multi-turn chat conversation."""
        payload: Dict[str, Any] = {
            "model": model or ollama_settings.default_chat_model,
            "messages": messages,
            "stream": stream,
            "keep_alive": keep_alive or ollama_settings.keep_alive,
        }
        if format_json:
            payload["format"] = "json"
        if tools:
            payload["tools"] = tools

        opts = {
            "temperature": ollama_settings.default_temperature,
            "seed": ollama_settings.default_seed,
        }
        if options:
            opts.update(options)
        payload["options"] = opts

        return self._request("/api/chat", method="POST", payload=payload, correlation_id=correlation_id)

    def chat_stream(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> Generator[Dict[str, Any], None, None]:
        """Streaming generator for multi-turn chat."""
        payload: Dict[str, Any] = {
            "model": model or ollama_settings.default_chat_model,
            "messages": messages,
            "stream": True,
            "keep_alive": ollama_settings.keep_alive,
        }
        if options:
            payload["options"] = options

        resp = self._request("/api/chat", method="POST", payload=payload, correlation_id=correlation_id, stream=True)
        try:
            for line in resp:
                if line:
                    chunk = json.loads(line.decode("utf-8"))
                    yield chunk
                    if chunk.get("done", False):
                        break
        finally:
            resp.close()

    def embeddings(
        self,
        prompt: str,
        model: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> List[float]:
        """POST /api/embeddings: Generate vector embedding."""
        model_tag = model or ollama_settings.default_embedding_model
        payload = {"model": model_tag, "prompt": prompt}
        resp = self._request("/api/embeddings", method="POST", payload=payload, correlation_id=correlation_id)
        return resp.get("embedding", [])

    def pull(self, model_name: str, stream: bool = False) -> Dict[str, Any]:
        """POST /api/pull: Download or update model."""
        return self._request("/api/pull", method="POST", payload={"name": model_name, "stream": stream}, timeout=600)

    def delete_model(self, model_name: str) -> Dict[str, Any]:
        """DELETE /api/delete: Remove model from local storage."""
        return self._request("/api/delete", method="DELETE", payload={"name": model_name})


# Singleton default client
_default_client: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    global _default_client
    if _default_client is None:
        _default_client = OllamaClient()
    return _default_client
