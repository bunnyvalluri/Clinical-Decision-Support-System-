"""
WebSocket URL routing for Django Channels.

All WebSocket consumers are registered here. The ASGI application
(config/asgi.py) wraps this with AllowedHostsOriginValidator and
AuthMiddlewareStack.

WS endpoint conventions:
  ws://host/ws/dashboard/         — Real-time dashboard updates
  ws://host/ws/alerts/            — Risk alert stream (all clinicians)
  ws://host/ws/patients/<id>/     — Per-patient real-time updates
  ws://host/ws/notifications/     — User-specific notifications
"""
from django.urls import re_path

from channels_app import consumers

websocket_urlpatterns = [
    re_path(r"^ws/dashboard/$", consumers.DashboardConsumer.as_asgi()),
    re_path(r"^ws/alerts/$", consumers.RiskAlertConsumer.as_asgi()),
    re_path(
        r"^ws/patients/(?P<patient_id>[0-9a-f-]{36})/$",
        consumers.PatientConsumer.as_asgi(),
    ),
    re_path(r"^ws/notifications/$", consumers.NotificationConsumer.as_asgi()),
    re_path(r"^ws/user/$", consumers.UserConsumer.as_asgi()),
]
