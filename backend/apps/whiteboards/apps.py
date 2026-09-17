"""
Whiteboards application configuration.
"""
from django.apps import AppConfig


class WhiteboardsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.whiteboards"
    verbose_name = "Clinical Whiteboards"
