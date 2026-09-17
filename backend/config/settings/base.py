"""
Base settings for BPY-CSE-2666 — Patient Risk Level Prediction System.

All environment-specific settings files (development.py, production.py)
inherit from this module. Secrets are read exclusively from environment
variables via python-decouple. Hard-coded credentials are NEVER acceptable.
"""
from pathlib import Path

import dj_database_url
from decouple import Csv, config

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent
# project root (4-1/)
ROOT_DIR = BASE_DIR.parent

import sys
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# ---------------------------------------------------------------------------
# Core Django
# ---------------------------------------------------------------------------
SECRET_KEY: str = config("DJANGO_SECRET_KEY", default=config("SECRET_KEY", default=""))
DEBUG: bool = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS: list[str] = config(
    "DJANGO_ALLOWED_HOSTS",
    default="localhost,127.0.0.1",
    cast=Csv(),
)

# ---------------------------------------------------------------------------
# Application definition
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    # daphne MUST come before django.contrib.staticfiles (daphne.E001)
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    # REST framework
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    # Channels (WebSockets) — daphne already listed in DJANGO_APPS (must be first)
    "channels",
    # Celery integrations
    "django_celery_beat",
    "django_celery_results",
    # Dev helpers
    "django_extensions",
]

LOCAL_APPS = [
    "apps.core.apps.CoreConfig",
    "apps.accounts.apps.AccountsConfig",
    "apps.patients.apps.PatientsConfig",
    "apps.clinical.apps.ClinicalConfig",
    "apps.predictions.apps.PredictionsConfig",
    "apps.ml_engine.apps.MlEngineConfig",
    "apps.model_registry.apps.ModelRegistryConfig",
    "apps.reports.apps.ReportsConfig",
    "apps.notifications.apps.NotificationsConfig",
    "apps.audit.apps.AuditConfig",
    "apps.ai_orchestrator.apps.AiOrchestratorConfig",
    "apps.patient_portal.apps.PatientPortalConfig",
    "apps.external_apis.apps.ExternalApisConfig",
    "apps.security_testing.apps.SecurityTestingConfig",
    "apps.mobile_gateway.apps.MobileGatewayConfig",
    "apps.whiteboards.apps.WhiteboardsConfig",
    "apps.nocodb.apps.NocodbConfig",
    "apps.search.apps.SearchConfig",
    "apps.infrastructure.apps.InfrastructureConfig",
    "apps.ai_agents.apps.AiAgentsConfig",
    "apps.web_intelligence.apps.WebIntelligenceConfig",
    "apps.engineering_loops.apps.EngineeringLoopsConfig",
]


INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "config.correlation.CorrelationMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Custom audit middleware
    "apps.core.middleware.AuditLogMiddleware",
]

ROOT_URLCONF = "config.urls"

# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# ASGI / WSGI
# ---------------------------------------------------------------------------
ASGI_APPLICATION = "config.asgi.application"
WSGI_APPLICATION = "config.wsgi.application"

# ---------------------------------------------------------------------------
# Database — Neon PostgreSQL (NEVER SQLite)
# ---------------------------------------------------------------------------
DATABASE_URL: str = config("DATABASE_URL")
DATABASE_URL_UNPOOLED: str = config("DATABASE_URL_UNPOOLED", default=DATABASE_URL)
DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    )
}
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
DATABASES["default"]["TEST"] = {
    "SERIALIZE": False,
}
# Explicit safety guard: refuse to start with SQLite
assert "sqlite" not in DATABASES["default"].get("ENGINE", ""), (
    "SQLite is not permitted. Configure DATABASE_URL to point at Neon PostgreSQL."
)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Custom user model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static / Media files
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Redis
# ---------------------------------------------------------------------------
REDIS_URL: str = config("REDIS_URL", default="redis://localhost:6379/0")

# ---------------------------------------------------------------------------
# Django Channels — Redis channel layer
# ---------------------------------------------------------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# ---------------------------------------------------------------------------
# Celery
# ---------------------------------------------------------------------------
import ssl

_raw_broker_url: str = config("CELERY_BROKER_URL", default=REDIS_URL)
_raw_result_backend: str = config("CELERY_RESULT_BACKEND", default=REDIS_URL)

if _raw_broker_url.startswith("rediss://") and "ssl_cert_reqs" not in _raw_broker_url:
    _sep = "&" if "?" in _raw_broker_url else "?"
    _raw_broker_url = f"{_raw_broker_url}{_sep}ssl_cert_reqs=CERT_NONE"
    CELERY_BROKER_USE_SSL = {"ssl_cert_reqs": ssl.CERT_NONE}

if _raw_result_backend.startswith("rediss://") and "ssl_cert_reqs" not in _raw_result_backend:
    _sep = "&" if "?" in _raw_result_backend else "?"
    _raw_result_backend = f"{_raw_result_backend}{_sep}ssl_cert_reqs=CERT_NONE"
    CELERY_REDIS_BACKEND_USE_SSL = {"ssl_cert_reqs": ssl.CERT_NONE}

CELERY_BROKER_URL: str = _raw_broker_url
CELERY_RESULT_BACKEND: str = _raw_result_backend
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes soft limit
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_RESULT_EXTENDED = True

# Task Routing & Dedicated Queues
CELERY_TASK_DEFAULT_QUEUE = "default"
CELERY_TASK_QUEUES = {
    "default": {"exchange": "default", "routing_key": "default"},
    "reports": {"exchange": "reports", "routing_key": "reports"},
    "notifications": {"exchange": "notifications", "routing_key": "notifications"},
    "ml": {"exchange": "ml", "routing_key": "ml"},
}
CELERY_TASK_ROUTES = {
    "apps.reports.tasks.*": {"queue": "reports"},
    "celery_tasks.report_tasks.*": {"queue": "reports"},
    "apps.notifications.tasks.*": {"queue": "notifications"},
    "celery_tasks.notification_tasks.*": {"queue": "notifications"},
    "apps.predictions.tasks.*": {"queue": "ml"},
    "celery_tasks.ml_tasks.*": {"queue": "ml"},
    "celery_tasks.scheduled_tasks.*": {"queue": "default"},
    "apps.search.tasks.*": {"queue": "default"},
}

# Worker concurrency & reliability
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "auth": "10/minute",
        "password_reset": "5/hour",
        "prediction_request": "60/minute",
    },
}

# ---------------------------------------------------------------------------
# JWT Settings
# ---------------------------------------------------------------------------
from datetime import timedelta  # noqa: E402

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", default=60, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS: list[str] = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
EMAIL_BACKEND: str = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST: str = config("EMAIL_HOST", default="localhost")
EMAIL_PORT: int = config("EMAIL_PORT", default=25, cast=int)
EMAIL_USE_TLS: bool = config("EMAIL_USE_TLS", default=False, cast=bool)
EMAIL_HOST_USER: str = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD: str = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL: str = config(
    "DEFAULT_FROM_EMAIL", default="noreply@clinical-ai.local"
)

# ---------------------------------------------------------------------------
# ML Settings
# ---------------------------------------------------------------------------
ML_ARTIFACTS_DIR: Path = Path(
    config("ML_ARTIFACTS_DIR", default=str(ROOT_DIR / "ml" / "artifacts"))
)
ML_RISK_THRESHOLDS = {
    "LOW": config("ML_DEFAULT_RISK_THRESHOLD_LOW", default=0.25, cast=float),
    "MEDIUM": config("ML_DEFAULT_RISK_THRESHOLD_MEDIUM", default=0.50, cast=float),
    "HIGH": config("ML_DEFAULT_RISK_THRESHOLD_HIGH", default=0.75, cast=float),
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {asctime} {message}",
            "style": "{",
        },
    },
    "filters": {
        "require_debug_true": {
            "()": "django.utils.log.RequireDebugTrue",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "django.log",
            "maxBytes": 1024 * 1024 * 5,  # 5 MB
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "channels": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# ---------------------------------------------------------------------------
# Centralized DevSecOps & Strix Security Testing Configuration
# ---------------------------------------------------------------------------
SECURITY_SCANNING_ENABLED = config("SECURITY_SCANNING_ENABLED", default=True, cast=bool)
SECURITY_SCAN_ENVIRONMENT = config("SECURITY_SCAN_ENVIRONMENT", default="SECURITY_TEST")
SECURITY_SCAN_MAX_CONCURRENCY = config("SECURITY_SCAN_MAX_CONCURRENCY", default=2, cast=int)
SECURITY_SCAN_MAX_DURATION = config("SECURITY_SCAN_MAX_DURATION", default=300, cast=int)
SECURITY_SCAN_MAX_BUDGET = config("SECURITY_SCAN_MAX_BUDGET", default=10.0, cast=float)
SECURITY_PRODUCTION_SCAN_ENABLED = config("SECURITY_PRODUCTION_SCAN_ENABLED", default=False, cast=bool)
SECURITY_ALLOWED_TARGETS = config("SECURITY_ALLOWED_TARGETS", default="localhost,127.0.0.1,cdss-staging.internal", cast=Csv())
SECURITY_ALLOWED_DOMAINS = config("SECURITY_ALLOWED_DOMAINS", default="localhost,127.0.0.1,cdss-staging.internal", cast=Csv())
SECURITY_ALLOW_EXTERNAL_STRIX = config("SECURITY_ALLOW_EXTERNAL_STRIX", default=False, cast=bool)
SECURITY_STRIX_VERSION = config("SECURITY_STRIX_VERSION", default="1.0.2")
SECURITY_STRIX_IMAGE = config("SECURITY_STRIX_IMAGE", default="usestrix/strix:1.0.2")
SECURITY_KILL_SWITCH = config("SECURITY_KILL_SWITCH", default=False, cast=bool)

# ---------------------------------------------------------------------------
# Firecrawl Web Intelligence & Controlled Web Retrieval Configuration
# ---------------------------------------------------------------------------
FIRECRAWL_ENABLED = config("FIRECRAWL_ENABLED", default=True, cast=bool)
FIRECRAWL_MODE = config("FIRECRAWL_MODE", default="self_hosted")
FIRECRAWL_BASE_URL = config("FIRECRAWL_BASE_URL", default="http://localhost:3002")
FIRECRAWL_API_KEY = config("FIRECRAWL_API_KEY", default="")
FIRECRAWL_CONNECT_TIMEOUT = config("FIRECRAWL_CONNECT_TIMEOUT", default=5, cast=int)
FIRECRAWL_REQUEST_TIMEOUT = config("FIRECRAWL_REQUEST_TIMEOUT", default=30, cast=int)
FIRECRAWL_MAX_CONCURRENCY = config("FIRECRAWL_MAX_CONCURRENCY", default=5, cast=int)
FIRECRAWL_MAX_CRAWL_PAGES = config("FIRECRAWL_MAX_CRAWL_PAGES", default=50, cast=int)
FIRECRAWL_MAX_BATCH_URLS = config("FIRECRAWL_MAX_BATCH_URLS", default=20, cast=int)
FIRECRAWL_MAX_CONTENT_BYTES = config("FIRECRAWL_MAX_CONTENT_BYTES", default=5242880, cast=int)
FIRECRAWL_ALLOWED_DOMAINS = config("FIRECRAWL_ALLOWED_DOMAINS", default="", cast=Csv())
FIRECRAWL_BLOCKED_DOMAINS = config("FIRECRAWL_BLOCKED_DOMAINS", default="", cast=Csv())
FIRECRAWL_ALLOW_PUBLIC_WEB_SEARCH = config("FIRECRAWL_ALLOW_PUBLIC_WEB_SEARCH", default=True, cast=bool)
FIRECRAWL_ALLOW_CRAWL = config("FIRECRAWL_ALLOW_CRAWL", default=True, cast=bool)
FIRECRAWL_ALLOW_INTERACT = config("FIRECRAWL_ALLOW_INTERACT", default=False, cast=bool)
FIRECRAWL_ALLOW_AGENT = config("FIRECRAWL_ALLOW_AGENT", default=False, cast=bool)
FIRECRAWL_ROBOTS_POLICY = config("FIRECRAWL_ROBOTS_POLICY", default="respect")
FIRECRAWL_CIRCUIT_FAIL_MAX = config("FIRECRAWL_CIRCUIT_FAIL_MAX", default=5, cast=int)
FIRECRAWL_CIRCUIT_RESET_SEC = config("FIRECRAWL_CIRCUIT_RESET_SEC", default=60, cast=int)
