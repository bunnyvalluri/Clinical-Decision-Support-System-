"""
ASGI configuration for BPY-CSE-2666.

Routes HTTP traffic to Django's standard ASGI handler and WebSocket
traffic through Django Channels with JWT authentication middleware.
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

# Initialise Django ASGI application early to ensure apps are loaded
# before importing from channels_app.
django_asgi_app = get_asgi_application()

# Import WS URL patterns AFTER Django setup
from channels_app.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            )
        ),
    }
)
