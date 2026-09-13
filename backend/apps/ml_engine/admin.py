"""ML Engine admin."""
from django.contrib import admin

from apps.ml_engine.models import MLModel


@admin.register(MLModel)
class MLModelAdmin(admin.ModelAdmin):
    list_display = ("name", "model_type", "dataset_name", "version", "status", "created_at")
    list_filter = ("model_type", "status", "dataset_name")
    search_fields = ("name", "version", "notes")
    readonly_fields = ("id", "created_at", "updated_at")
