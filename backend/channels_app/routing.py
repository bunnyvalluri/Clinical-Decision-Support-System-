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

from channels_app import consumers, web_consumers
from apps.mobile_gateway.consumers import MobileGatewayConsumer
from apps.ai_agents.consumers import AIAgentConsumer
from channels_app.security_consumers import SecurityAgentConsumer
from channels_app.loop_consumers import EngineeringLoopConsumer
from channels_app.jules_consumers import JulesAutomationConsumer
from channels_app.kaggle_consumers import KaggleDatasetConsumer
from channels_app.browser_agent_consumers import BrowserAgentTaskConsumer

websocket_urlpatterns = [
    re_path(r"^ws/dashboard/$", consumers.DashboardConsumer.as_asgi()),
    re_path(r"^ws/alerts/$", consumers.RiskAlertConsumer.as_asgi()),
    re_path(
        r"^ws/patients/(?P<patient_id>[0-9a-f-]{36})/$",
        consumers.PatientConsumer.as_asgi(),
    ),
    re_path(r"^ws/notifications/$", consumers.NotificationConsumer.as_asgi()),
    re_path(r"^ws/user/$", consumers.UserConsumer.as_asgi()),
    re_path(r"^ws/ai/(?:(?P<workflow_id>[0-9a-f-]{36})/)?$", consumers.AIOrchestratorConsumer.as_asgi()),
    re_path(r"^ws/ai/agent/(?P<session_id>[0-9a-f-]{36})/$", AIAgentConsumer.as_asgi()),
    re_path(r"^ws/ai-agents/tasks/$", BrowserAgentTaskConsumer.as_asgi()),
    re_path(r"^ws/mobile/$", MobileGatewayConsumer.as_asgi()),
    re_path(r"^ws/whiteboards/(?P<whiteboard_id>[0-9a-f-]{36})/$", consumers.WhiteboardCollaborationConsumer.as_asgi()),
    re_path(r"^ws/nocodb/(?P<dataset_slug>[a-zA-Z0-9_-]+)/$", consumers.NocoDBWorkspaceConsumer.as_asgi()),
    re_path(r"^ws/web/$", web_consumers.WebIntelligenceConsumer.as_asgi()),
    re_path(r"^ws/security/agents/$", SecurityAgentConsumer.as_asgi()),
    re_path(r"^ws/engineering/loops/$", EngineeringLoopConsumer.as_asgi()),
    re_path(r"^ws/automation/jules/$", JulesAutomationConsumer.as_asgi()),
    re_path(r"^ws/datasets/(?:(?P<dataset_id>[0-9a-f-]{36})/)?$", KaggleDatasetConsumer.as_asgi()),
]




