"""Notifications URL configuration."""
from django.urls import path
from apps.notifications.views import (
    notification_list_view,
    notification_mark_read_view,
    notification_mark_all_read_view,
)

app_name = "notifications"

urlpatterns = [
    path("", notification_list_view, name="notification_list"),
    path("<uuid:pk>/read/", notification_mark_read_view, name="notification_mark_read"),
    path("mark-all-read/", notification_mark_all_read_view, name="notification_mark_all_read"),
]
