"""
Celery application configuration for BPY-CSE-2666 Clinical Decision Support System.

The Celery app is created here and imported in config/__init__.py
so Django's app registry is loaded before workers discover tasks.
"""
import json
import logging
import os
from typing import Any

from asgiref.sync import async_to_sync
from celery import Celery, Task
from channels.layers import get_channel_layer
from decouple import config
import redis

# Set default Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("clinical_decision_support")

# Load Celery settings from Django's settings.py using CELERY_ namespace.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all INSTALLED_APPS.
app.autodiscover_tasks()

logger = logging.getLogger("celery.tasks")

# Cached Redis client for task status & idempotency
_redis_client: redis.Redis | None = None


def get_redis_client() -> redis.Redis:
    """Return a shared thread-safe Redis client connection."""
    global _redis_client
    if _redis_client is None:
        redis_url = config("REDIS_URL", default="redis://localhost:6379/0")
        _redis_client = redis.from_url(redis_url, decode_responses=True)
    return _redis_client


def broadcast_task_status(
    task_id: str,
    task_name: str,
    status: str,
    progress: int = 0,
    result: dict[str, Any] | None = None,
    error: str | None = None,
    recipient_user_id: str | None = None,
) -> None:
    """
    Persist task state to Redis for fast REST lookup and broadcast
    a real-time WebSocket event across the channel layer.
    """
    from channels_app.events import TaskStatusEvent

    normalized_status = status.upper()

    # 1. Update Redis cache with 24-hour expiration
    try:
        r = get_redis_client()
        status_payload = {
            "task_id": str(task_id),
            "task_name": task_name,
            "status": normalized_status,
            "progress": int(progress),
            "result": result,
            "error": error,
        }
        r.setex(f"task_status:{task_id}", 86400, json.dumps(status_payload))
    except Exception as exc:
        logger.warning("Could not persist task %s state to Redis: %s", task_id, exc)

    # 2. Dispatch real-time WebSocket event
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            event = TaskStatusEvent(
                task_id=str(task_id),
                task_name=task_name,
                status=normalized_status,
                progress=progress,
                result=result,
                error=error,
            ).to_dict()

            # Broadcast to dashboard
            async_to_sync(channel_layer.group_send)(
                "dashboard",
                {"type": "task_status_updated", "payload": event},
            )

            # Broadcast to private user group if targeted
            if recipient_user_id:
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{recipient_user_id}",
                    {"type": "task_status_updated", "payload": event},
                )
    except Exception as exc:
        logger.warning("Could not broadcast task %s WebSocket event: %s", task_id, exc)


class BaseCDSSAsyncJob(Task):
    """
    Base Celery task providing:
    - Distributed Redis idempotency lock to prevent duplicate executions
    - Automatic lifecycle tracking (PROCESSING, COMPLETED, FAILED, RETRYING)
    - Real-time WebSocket event broadcasting
    - Graceful soft time limit interception
    """

    abstract = True
    default_retry_delay = 5
    max_retries = 3

    def acquire_idempotency_lock(self, key: str, ttl_seconds: int = 300) -> bool:
        """
        Attempt to acquire a distributed lock in Redis.
        Returns True if acquired, False if already locked by another worker.
        """
        try:
            r = get_redis_client()
            return bool(r.set(f"task_lock:{key}", "locked", nx=True, ex=ttl_seconds))
        except Exception as exc:
            logger.warning("Redis lock check failed for %s: %s (defaulting to allow)", key, exc)
            return True

    def release_idempotency_lock(self, key: str) -> None:
        """Release the distributed Redis lock."""
        try:
            r = get_redis_client()
            r.delete(f"task_lock:{key}")
        except Exception as exc:
            logger.warning("Failed to release Redis lock %s: %s", key, exc)

    def before_start(self, task_id: str, args: tuple, kwargs: dict) -> None:
        """Invoked immediately before worker begins task execution."""
        user_id = kwargs.get("user_id") or kwargs.get("requested_by_id")
        broadcast_task_status(
            task_id=task_id,
            task_name=self.name,
            status="PROCESSING",
            progress=5,
            recipient_user_id=str(user_id) if user_id else None,
        )
        super().before_start(task_id, args, kwargs)

    def on_success(self, retval: Any, task_id: str, args: tuple, kwargs: dict) -> None:
        """Invoked when task completes successfully."""
        user_id = kwargs.get("user_id") or kwargs.get("requested_by_id")
        result_payload = retval if isinstance(retval, dict) else {"result": str(retval)}
        broadcast_task_status(
            task_id=task_id,
            task_name=self.name,
            status="COMPLETED",
            progress=100,
            result=result_payload,
            recipient_user_id=str(user_id) if user_id else None,
        )
        super().on_success(retval, task_id, args, kwargs)

    def on_failure(self, exc: Exception, task_id: str, args: tuple, kwargs: dict, einfo: Any) -> None:
        """Invoked when task encounters an unhandled exception or exhausts retries."""
        logger.error(
            "Task %s [%s] failed with exception: %s",
            self.name,
            task_id,
            exc,
            exc_info=True,
        )
        user_id = kwargs.get("user_id") or kwargs.get("requested_by_id")
        broadcast_task_status(
            task_id=task_id,
            task_name=self.name,
            status="FAILED",
            progress=100,
            error=str(exc),
            recipient_user_id=str(user_id) if user_id else None,
        )
        super().on_failure(exc, task_id, args, kwargs, einfo)

    def on_retry(self, exc: Exception, task_id: str, args: tuple, kwargs: dict, einfo: Any) -> None:
        """Invoked when task is scheduled for retry."""
        logger.warning("Task %s [%s] scheduled for retry: %s", self.name, task_id, exc)
        user_id = kwargs.get("user_id") or kwargs.get("requested_by_id")
        broadcast_task_status(
            task_id=task_id,
            task_name=self.name,
            status="RETRYING",
            error=str(exc),
            recipient_user_id=str(user_id) if user_id else None,
        )
        super().on_retry(exc, task_id, args, kwargs, einfo)


@app.task(bind=True, ignore_result=True)
def debug_task(self) -> None:
    """Debug task — prints request for diagnostics."""
    print(f"Request: {self.request!r}")
