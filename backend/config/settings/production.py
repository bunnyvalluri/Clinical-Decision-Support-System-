"""
Production settings.

Extends base settings with hardened security configuration.
All sensitive values MUST be supplied via environment variables.
"""
from config.settings.base import *  # noqa: F401, F403
from decouple import config

# ---------------------------------------------------------------------------
# Security hardening
# ---------------------------------------------------------------------------
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)

SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=False, cast=bool)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# ---------------------------------------------------------------------------
# CORS — allow Vercel frontend
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "https://clinical-decision-support-system-20.vercel.app",
    "https://clinical-decision-support-system-2026.vercel.app",
]
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Remove daphne from INSTALLED_APPS in production (using gunicorn+uvicorn)
# ---------------------------------------------------------------------------
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "daphne"]
