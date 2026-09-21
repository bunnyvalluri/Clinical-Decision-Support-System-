# =============================================================================
# Production Multi-Stage Dockerfile for BPY-CSE-2666 Clinical Backend
# =============================================================================
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies (libpq for PostgreSQL, build essentials, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system group and user
RUN groupadd -r -g 1001 appgroup && \
    useradd -r -u 1001 -g appgroup -s /sbin/nologin -c "Clinical Backend User" appuser

WORKDIR /app

# -----------------------------------------------------------------------------
# Dependency installation stage
# -----------------------------------------------------------------------------
FROM base AS dependencies

COPY requirements/base.txt requirements/base.txt
COPY requirements/production.txt requirements/production.txt
COPY requirements/ requirements/
RUN pip install --prefix=/install -r requirements/production.txt

# -----------------------------------------------------------------------------
# Final production runtime stage
# -----------------------------------------------------------------------------
FROM base AS runner

COPY --from=dependencies /install /usr/local

# Copy application source code
COPY . .

# Create required directories for runtime logs, media, staticfiles with strict permissions
RUN mkdir -p /app/logs /app/staticfiles /app/media && \
    chown -R appuser:appgroup /app && \
    chmod -R 755 /app

# Switch to unprivileged user
USER appuser

EXPOSE 8000

# Health check probe
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
    CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

# Use gunicorn with uvicorn workers (more stable than daphne on Render free tier)
CMD ["gunicorn", "config.asgi:application", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "1", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--keep-alive", "5", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
