"""
Ollama Health Monitoring & Diagnostics Engine.
"""
import logging
import time
from typing import Any, Dict

from .client import get_ollama_client
from .config import ollama_settings

logger = logging.getLogger("integrations.ollama.health")


class OllamaHealthChecker:
    """
    Evaluates connection vitality, installed models, memory utilization,
    and circuit breaker status for local Ollama daemon.
    """

    @classmethod
    def check_health(cls) -> Dict[str, Any]:
        client = get_ollama_client()
        start_t = time.time()
        
        status = "healthy"
        is_connected = False
        installed_models = []
        running_models = []
        error_detail = None
        latency_ms = 0.0

        try:
            models_data = client.list_models()
            is_connected = True
            installed_models = [
                {
                    "name": m.get("name"),
                    "size": m.get("size", 0),
                    "modified_at": m.get("modified_at"),
                    "digest": m.get("digest", "")[:12] if m.get("digest") else "",
                }
                for m in models_data
            ]

            try:
                running_data = client.running_models()
                running_models = [
                    {
                        "name": r.get("name"),
                        "size": r.get("size", 0),
                        "size_vram": r.get("size_vram", 0),
                        "expires_at": r.get("expires_at"),
                    }
                    for r in running_data
                ]
            except Exception:
                running_models = []

        except Exception as exc:
            status = "unhealthy"
            is_connected = False
            error_detail = str(exc)
            logger.debug("Ollama health probe failure: %s", exc)

        latency_ms = round((time.time() - start_t) * 1000.0, 2)

        circuit_state = client.circuit_breaker.state.value

        return {
            "status": status,
            "connected": is_connected,
            "base_url": client.base_url,
            "version_pinned": "0.5.12",
            "latency_ms": latency_ms,
            "circuit_breaker": {
                "state": circuit_state,
                "failure_count": client.circuit_breaker.failure_count,
            },
            "installed_models_count": len(installed_models),
            "installed_models": installed_models,
            "running_models_count": len(running_models),
            "running_models": running_models,
            "default_chat_model": ollama_settings.default_chat_model,
            "default_embedding_model": ollama_settings.default_embedding_model,
            "error": error_detail,
        }
