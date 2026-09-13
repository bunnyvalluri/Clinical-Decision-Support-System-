"""
Repositories package.

Data-access layer: wraps Django ORM querysets behind clean interfaces.
Service classes use repositories — they never write raw ORM queries.
This decouples business logic from the persistence layer.
"""
from repositories.prediction_repository import (
    DjangoPredictionRepository,
    IPredictionRepository,
)

__all__ = [
    "IPredictionRepository",
    "DjangoPredictionRepository",
]
