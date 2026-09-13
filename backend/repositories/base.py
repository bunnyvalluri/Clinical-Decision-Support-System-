"""
Base repository class.

All repository classes inherit from BaseRepository to get a consistent
interface for common CRUD operations. Subclasses define ``model`` and
may override methods for domain-specific query logic.
"""
import logging
from typing import Any, Generic, TypeVar

from django.db import models as django_models

from apps.core.exceptions import NotFoundError

ModelT = TypeVar("ModelT", bound=django_models.Model)


class BaseRepository(Generic[ModelT]):
    """
    Generic repository providing standard CRUD operations.

    Usage::

        class PatientRepository(BaseRepository[Patient]):
            model = Patient
    """

    model: type[ModelT]

    def __init__(self) -> None:
        self.logger = logging.getLogger(
            f"{self.__class__.__module__}.{self.__class__.__name__}"
        )

    def get_by_id(self, pk: Any) -> ModelT:
        """Retrieve a single record by primary key or raise NotFoundError."""
        try:
            return self.model.objects.get(pk=pk)
        except self.model.DoesNotExist:
            raise NotFoundError(
                f"{self.model.__name__} with id '{pk}' not found."
            )

    def get_all(self) -> django_models.QuerySet[ModelT]:
        """Return all records (applies default manager filtering)."""
        return self.model.objects.all()

    def create(self, **kwargs: Any) -> ModelT:
        """Create and return a new record."""
        instance = self.model(**kwargs)
        instance.full_clean()
        instance.save()
        return instance

    def update(self, instance: ModelT, **kwargs: Any) -> ModelT:
        """Update fields on an existing record and return it."""
        for field, value in kwargs.items():
            setattr(instance, field, value)
        instance.full_clean()
        instance.save()
        return instance

    def delete(self, instance: ModelT) -> None:
        """Delete a record (delegates to model's delete method)."""
        instance.delete()

    def filter(self, **kwargs: Any) -> django_models.QuerySet[ModelT]:
        """Return a filtered queryset."""
        return self.model.objects.filter(**kwargs)

    def exists(self, **kwargs: Any) -> bool:
        """Return True if any matching record exists."""
        return self.model.objects.filter(**kwargs).exists()

    def count(self, **kwargs: Any) -> int:
        """Return count of matching records."""
        return self.model.objects.filter(**kwargs).count()
