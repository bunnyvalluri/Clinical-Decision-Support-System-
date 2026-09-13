"""Core admin registrations."""
from django.contrib import admin

from apps.core.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "resource_type", "resource_id", "ip_address")
    list_filter = ("action", "resource_type")
    search_fields = ("user__email", "resource_id", "description")
    readonly_fields = ("timestamp", "user", "action", "resource_type", "resource_id",
                       "description", "ip_address", "user_agent", "metadata")
    ordering = ("-timestamp",)

    def has_add_permission(self, request) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False
