"""
Management command to configure and register Meilisearch indexes and settings.
Usage: python manage.py setup_search_indexes
"""
from django.core.management.base import BaseCommand
from integrations.meilisearch.index_manager import get_index_manager


class Command(BaseCommand):
    help = "Initializes all required Meilisearch indexes, settings, and typo-tolerance policies."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Configuring Meilisearch indexes..."))
        manager = get_index_manager()
        res = manager.setup_all_indexes()
        if res.get("status") == "success":
            self.stdout.write(self.style.SUCCESS("All Meilisearch indexes configured successfully."))
        else:
            self.stdout.write(self.style.WARNING(f"Index setup result: {res}"))
