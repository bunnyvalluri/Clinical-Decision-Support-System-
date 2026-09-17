"""
Ollama Integration Configuration & Runtime Defaults.
"""
from dataclasses import dataclass
from decouple import config


@dataclass(frozen=True)
class OllamaSettings:
    base_url: str = config("OLLAMA_BASE_URL", default="http://localhost:11434")
    request_timeout: int = config("OLLAMA_REQUEST_TIMEOUT", default=60, cast=int)
    connect_timeout: int = config("OLLAMA_CONNECT_TIMEOUT", default=5, cast=int)
    max_concurrency: int = config("OLLAMA_MAX_CONCURRENCY", default=8, cast=int)
    keep_alive: str = config("OLLAMA_KEEP_ALIVE", default="15m")
    default_chat_model: str = config("OLLAMA_DEFAULT_CHAT_MODEL", default="llama3.3:8b-instruct-q4_K_M")
    default_embedding_model: str = config("OLLAMA_DEFAULT_EMBEDDING_MODEL", default="nomic-embed-text:latest")
    default_temperature: float = config("OLLAMA_DEFAULT_TEMPERATURE", default=0.1, cast=float)
    default_seed: int = config("OLLAMA_DEFAULT_SEED", default=42, cast=int)
    circuit_breaker_threshold: int = config("OLLAMA_CIRCUIT_BREAKER_THRESHOLD", default=5, cast=int)
    circuit_breaker_recovery_seconds: int = config("OLLAMA_CIRCUIT_BREAKER_RECOVERY", default=30, cast=int)


ollama_settings = OllamaSettings()
