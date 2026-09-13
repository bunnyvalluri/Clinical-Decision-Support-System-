# syntax=docker/dockerfile:1.4
# =============================================================================
# Production Dockerfile for Django Backend — BPY-CSE-2666
# Multi-stage build for minimal image size and non-root security.
# =============================================================================

# --- Stage 1: Build wheels ---
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements/ /build/requirements/
RUN pip install --upgrade pip setuptools wheel && \
    pip wheel --no-cache-dir --wheel-dir /build/wheels -r /build/requirements/production.txt

# --- Stage 2: Final runtime ---
FROM python:3.12-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY backend/ /app/
RUN mkdir -p /app/staticfiles /app/media /app/logs /app/ml/artifacts

RUN useradd -m -u 1001 -s /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
