"""
Django configuration package.

Exposes the Celery application so that tasks are auto-discovered
when Django starts.
"""
from config.celery import app as celery_app  # noqa: F401

__all__ = ("celery_app",)
