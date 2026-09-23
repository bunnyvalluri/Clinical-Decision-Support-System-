"""
Development settings.

Extends base settings with developer-friendly configuration:
  - DEBUG = True
  - DRF browsable API renderer enabled
  - Django debug toolbar
  - Verbose logging
  - Relaxed CORS/CSRF
"""
from config.settings.base import *  # noqa: F401, F403
from config.settings.base import INSTALLED_APPS, MIDDLEWARE, REST_FRAMEWORK

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "testserver", "*"]

# Allow DRF browsable API in development
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

# Django debug toolbar (opt-in only, disabled by default to prevent API latency)
ENABLE_DEBUG_TOOLBAR = config("ENABLE_DEBUG_TOOLBAR", default=False, cast=bool)
if ENABLE_DEBUG_TOOLBAR:
    INSTALLED_APPS = INSTALLED_APPS + ["debug_toolbar"]
    MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE

INTERNAL_IPS = ["127.0.0.1", "::1"]

# Relaxed security for local development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Email: console backend in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
