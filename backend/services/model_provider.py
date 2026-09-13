"""
ModelProvider — Abstraction layer for retrieving active machine learning models.
"""
from abc import ABC, abstractmethod
from typing import Any

from services.model_loader import ModelLoaderService, NoActiveModelError, InvalidArtifactError


class ModelUnavailableError(Exception):
    """Raised when no operational ML model is available for serving."""
    pass


class IModelProvider(ABC):
    """Interface for retrieving machine learning model artifacts and version metadata."""

    @abstractmethod
    def get_model(self, model_name: str | None = None) -> tuple[Any, Any]:
        """
        Return the operational pipeline and its corresponding metadata record.
        Returns:
            (scikit-learn Pipeline, ModelVersion)
        Raises:
            ModelUnavailableError: If no active model can be loaded.
        """
        pass

    @abstractmethod
    def invalidate_cache(self, model_name: str | None = None) -> None:
        """Evict cached model from memory."""
        pass


class RegistryModelProvider(IModelProvider):
    """
    Concrete provider that retrieves active models from PostgreSQL and
    leverages the thread-safe in-memory cache of ModelLoaderService.
    """

    def get_model(self, model_name: str | None = None) -> tuple[Any, Any]:
        try:
            return ModelLoaderService.get_active_model(model_name=model_name)
        except (NoActiveModelError, InvalidArtifactError) as exc:
            raise ModelUnavailableError(
                f"Active model '{model_name or 'default'}' is unavailable: {exc}"
            ) from exc

    def invalidate_cache(self, model_name: str | None = None) -> None:
        ModelLoaderService.invalidate_cache(model_name=model_name)
