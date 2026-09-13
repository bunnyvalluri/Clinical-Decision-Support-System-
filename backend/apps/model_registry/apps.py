"""Model registry app configuration."""
from django.apps import AppConfig


class ModelRegistryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.model_registry"
    verbose_name = "ML Model Registry"
