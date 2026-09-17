"""
Management command to bulk reindex entities from Neon PostgreSQL to Meilisearch.
Usage: python manage.py reindex_all_search [--index=patients]
"""
from django.core.management.base import BaseCommand
from apps.search.tasks import reindex_all_search_task


class Command(BaseCommand):
    help = "Bulk reindexes entities directly from Neon PostgreSQL into Meilisearch."

    def add_arguments(self, parser):
        parser.add_argument(
            "--index",
            type=str,
            default="",
            help="Specific index UID to rebuild (e.g. patients, models). Rebuilds all if omitted.",
        )

    def handle(self, *args, **options):
        index_name = options["index"]
        self.stdout.write(self.style.NOTICE(f"Starting bulk reindex for '{index_name or 'all indexes'}'..."))
        result = reindex_all_search_task(index_name)
        self.stdout.write(self.style.SUCCESS(f"Reindex task completed: {result}"))
