"""AppConfig for the core app."""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Core"

    def ready(self) -> None:
        """Import signals when the app is ready."""
        import apps.core.signals  # noqa: F401
