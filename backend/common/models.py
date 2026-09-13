"""Shared common model abstractions."""
from apps.core.models import AllObjectsManager, BaseModel, SoftDeleteManager, SoftDeleteModel

__all__ = ["BaseModel", "SoftDeleteModel", "SoftDeleteManager", "AllObjectsManager"]
