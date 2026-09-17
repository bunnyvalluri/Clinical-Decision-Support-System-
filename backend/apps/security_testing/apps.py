"""
App configuration for Security Testing (Agentic-Bug-Hunter Integration).
"""
from django.apps import AppConfig


class SecurityTestingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.security_testing"
    verbose_name = "Controlled Security Testing & Vulnerability Management"

    def ready(self):
        # Register signals or check baseline if needed
        try:
            import apps.security_testing.signals  # noqa: F401
        except ImportError:
            pass
