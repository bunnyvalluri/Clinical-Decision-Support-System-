"""
Celery application configuration for BPY-CSE-2666.

The Celery app is created here and imported in config/__init__.py
so Django's app registry is loaded before workers discover tasks.
"""
import os

from celery import Celery

# Set the default Django settings module for the 'celery' CLI program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("clinical_decision_support")

# Load Celery settings from Django's settings.py using the CELERY_ namespace.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all INSTALLED_APPS.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self) -> None:
    """Debug task — prints the current request for diagnostics."""
    print(f"Request: {self.request!r}")
