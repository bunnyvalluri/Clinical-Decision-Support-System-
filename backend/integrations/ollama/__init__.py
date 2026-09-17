"""
Ollama Integration Package.
Self-Hosted / Local LLM Inference Layer for Clinical Decision Support System.
"""
from .client import OllamaClient, get_ollama_client
from .config import OllamaSettings, ollama_settings
from .exceptions import (
    CircuitBreakerOpenError,
    ContextBudgetExceededError,
    ModelNotApprovedError,
    ModelNotFoundError,
    OllamaConnectionError,
    OllamaError,
    OllamaTimeoutError,
    PHIViolationError,
    StructuredOutputValidationError,
    ToolExecutionError,
)
from .health import OllamaHealthChecker
from .models import OllamaModelService
from .embeddings import OllamaEmbeddingService
from .chat import OllamaChatService
from .structured_output import OllamaStructuredOutputService
from .tool_calling import OllamaToolRegistry
from .vision import OllamaVisionService
from .security import OllamaSecurityFilter
from .metrics import OllamaMetricsCollector
from .provider import OllamaProvider

__all__ = [
    "OllamaClient",
    "get_ollama_client",
    "OllamaSettings",
    "ollama_settings",
    "OllamaError",
    "OllamaConnectionError",
    "OllamaTimeoutError",
    "ModelNotFoundError",
    "ModelNotApprovedError",
    "CircuitBreakerOpenError",
    "ContextBudgetExceededError",
    "StructuredOutputValidationError",
    "ToolExecutionError",
    "PHIViolationError",
    "OllamaHealthChecker",
    "OllamaModelService",
    "OllamaEmbeddingService",
    "OllamaChatService",
    "OllamaStructuredOutputService",
    "OllamaToolRegistry",
    "OllamaVisionService",
    "OllamaSecurityFilter",
    "OllamaMetricsCollector",
    "OllamaProvider",
]
