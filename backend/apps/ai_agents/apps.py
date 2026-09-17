from django.apps import AppConfig


class AiAgentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.ai_agents"
    verbose_name = "Clinical AI Agents"

    def ready(self):
        # Import signal handlers or register built-in tools on startup if needed
        pass
