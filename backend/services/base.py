"""
Base service class.

All application service classes inherit from BaseService to get
common patterns: dependency injection, structured logging, and
exception normalisation.
"""
import logging
from typing import Any


class BaseService:
    """
    Abstract base for all service classes.

    Services encapsulate business logic and coordinate between the
    repository layer (data access) and external systems (ML, email, etc.).

    They are NEVER called from models. Views call services; services call
    repositories. ML logic lives in dedicated ML services only.
    """

    def __init__(self) -> None:
        self.logger = logging.getLogger(
            f"{self.__class__.__module__}.{self.__class__.__name__}"
        )

    def _log_operation(self, operation: str, **kwargs: Any) -> None:
        """Structured operation log entry."""
        self.logger.info("Operation: %s | %s", operation, kwargs)
