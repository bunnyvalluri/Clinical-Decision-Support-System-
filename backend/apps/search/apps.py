from django.apps import AppConfig


class SearchConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.search"
    verbose_name = "Search Platform (Meilisearch)"

    def ready(self):
        # Register signals for outbox event capture
        try:
            import apps.search.signals  # noqa: F401
        except Exception:
            pass
