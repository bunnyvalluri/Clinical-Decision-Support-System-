"""
Custom Typed Exceptions for Ollama Inference Layer.
"""


class OllamaError(Exception):
    """Base exception for all Ollama integration operations."""
    pass


class OllamaConnectionError(OllamaError):
    """Raised when Ollama daemon is unreachable or network connection fails."""
    pass


class OllamaTimeoutError(OllamaError):
    """Raised when an inference or embedding call exceeds configured timeout."""
    pass


class ModelNotFoundError(OllamaError):
    """Raised when requested model tag is not installed in the local daemon."""
    pass


class ModelNotApprovedError(OllamaError):
    """Raised when attempting to route clinical requests to an unapproved model."""
    pass


class CircuitBreakerOpenError(OllamaError):
    """Raised when consecutive failures have tripped the circuit breaker open."""
    pass


class ContextBudgetExceededError(OllamaError):
    """Raised when token length exceeds model context capacity."""
    pass


class StructuredOutputValidationError(OllamaError):
    """Raised when model output fails to parse or satisfy strict JSON schema."""
    pass


class ToolExecutionError(OllamaError):
    """Raised when an allowlisted tool call fails execution or argument validation."""
    pass


class PHIViolationError(OllamaError):
    """Raised when prompt contains unredacted PHI or attempts unauthorized egress."""
    pass
