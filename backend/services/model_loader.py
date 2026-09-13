"""
Model Loading Service with In-Memory Caching.
Eliminates disk I/O on production inference requests, enforces strict ACTIVE model checks,
and handles corrupt/missing artifacts safely.
"""
from pathlib import Path
import threading
from typing import Any
from django.conf import settings
import joblib
from sklearn.pipeline import Pipeline

from apps.core.exceptions import ApplicationError
from apps.model_registry.models import ModelStatus, ModelVersion
from services.base import BaseService


class ModelLoaderError(ApplicationError):
    message = "Model loading error occurred."
    code = "model_loader_error"
    status_code = 500


class NoActiveModelError(ModelLoaderError):
    message = "No active production model is deployed for the requested clinical target."
    code = "no_active_model"
    status_code = 404


class InvalidArtifactError(ModelLoaderError):
    message = "Model artifact is missing, invalid, or corrupted."
    code = "invalid_model_artifact"
    status_code = 500


class ModelLoaderService(BaseService):
    """
    Thread-safe in-memory model caching service.
    Loads and caches deserialized ML pipelines so production inference does not
    hit disk or database unpickling on every HTTP transaction.
    """

    # Class-level cache: model_name -> (Pipeline, ModelVersion)
    _cache: dict[str, tuple[Pipeline, ModelVersion]] = {}
    _lock = threading.Lock()

    @classmethod
    def _resolve_artifact_path(cls, location: str) -> Path:
        """Resolve artifact location to absolute filesystem Path."""
        path = Path(location)
        if path.is_absolute() and path.exists():
            return path

        # Try relative to repo root (parent of backend)
        root_path = settings.BASE_DIR.parent / location
        if root_path.exists():
            return root_path

        # Try relative to backend
        backend_path = settings.BASE_DIR / location
        if backend_path.exists():
            return backend_path

        return path

    @classmethod
    def get_active_model(
        cls, model_name: str | None = None
    ) -> tuple[Pipeline, ModelVersion]:
        """
        Retrieve the active production model pipeline and metadata.
        Fast in-memory cache lookup (< 0.1ms). Remote DB query only occurs on cache-miss.
        
        Guarantees that:
        1. Only an ACTIVE model can serve predictions.
        2. Returns cached pipeline from RAM with zero DB or disk I/O.
        3. Never loads from disk repeatedly.
        """
        with cls._lock:
            # Fast-path: if model_name is specified and cached, return immediately
            if model_name and model_name in cls._cache:
                return cls._cache[model_name]
            # If model_name is not specified but cache has an active model, return it
            if not model_name and cls._cache:
                return next(iter(cls._cache.values()))

        # Cache miss: query database for active record
        query = ModelVersion.objects.filter(status=ModelStatus.ACTIVE)
        if model_name:
            query = query.filter(model_name=model_name)
        active_record = query.first()

        if not active_record:
            target_desc = f"'{model_name}'" if model_name else "any model"
            raise NoActiveModelError(
                f"No active production model is configured for {target_desc}. "
                "Only models in ACTIVE status can serve production predictions."
            )

        with cls._lock:
            # Double-check inside lock
            if active_record.model_name in cls._cache:
                cached_pipe, cached_record = cls._cache[active_record.model_name]
                if cached_record.id == active_record.id:
                    return cached_pipe, active_record

            # Load artifact from disk
            resolved_path = cls._resolve_artifact_path(active_record.artifact_location)
            if not resolved_path.exists():
                raise InvalidArtifactError(
                    f"Model artifact file does not exist at '{active_record.artifact_location}'."
                )

            try:
                pipeline: Pipeline = joblib.load(resolved_path)
            except Exception as exc:
                raise InvalidArtifactError(
                    f"Failed to deserialize model artifact at '{resolved_path}': {exc}"
                ) from exc

            cls._cache[active_record.model_name] = (pipeline, active_record)
            return pipeline, active_record

    @classmethod
    def get_model_version(
        cls, model_name: str, version: str
    ) -> tuple[Pipeline, ModelVersion]:
        """
        Load a specific version of a model (used for auditing, comparison, or candidate testing).
        """
        record = ModelVersion.objects.filter(
            model_name=model_name,
            version=version,
        ).first()

        if not record:
            raise NoActiveModelError(
                f"Model '{model_name}' version '{version}' does not exist in registry."
            )

        resolved_path = cls._resolve_artifact_path(record.artifact_location)
        if not resolved_path.exists():
            raise InvalidArtifactError(
                f"Model artifact file does not exist at '{record.artifact_location}'."
            )

        try:
            pipeline: Pipeline = joblib.load(resolved_path)
        except Exception as exc:
            raise InvalidArtifactError(
                f"Failed to deserialize model artifact at '{resolved_path}': {exc}"
            ) from exc

        return pipeline, record

    @classmethod
    def warmup_active_models(cls) -> int:
        """
        Pre-warm active production models into RAM when the application starts.
        Ensures zero-cold-start latency on initial user requests.
        """
        active_records = ModelVersion.objects.filter(status=ModelStatus.ACTIVE)
        warmed = 0

        for record in active_records:
            try:
                cls.get_active_model(record.model_name)
                warmed += 1
            except Exception:
                pass

        return warmed

    @classmethod
    def invalidate_cache(cls, model_name: str | None = None) -> None:
        """Evict model from memory cache when model promotion or rollback occurs."""
        with cls._lock:
            if model_name:
                cls._cache.pop(model_name, None)
            else:
                cls._cache.clear()

    @classmethod
    def is_cached(cls, model_name: str) -> bool:
        """Check whether model currently resides in memory."""
        with cls._lock:
            return model_name in cls._cache
