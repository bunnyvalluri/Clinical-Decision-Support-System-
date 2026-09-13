"""
Universal asynchronous task status tracking view.
Inspects Redis live cache, Celery AsyncResult, and django_celery_results fallback.
"""
import json
import logging
from typing import Any

from celery.result import AsyncResult
from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from config.celery import app as celery_app, get_redis_client

logger = logging.getLogger(__name__)


class TaskStatusView(APIView):
    """
    GET /api/v1/tasks/{task_id}/

    Retrieves current status, progress percentage, result, or error of a background Celery task.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, task_id: str) -> Response:
        task_id = str(task_id).strip()

        # 1. Check fast Redis live status cache
        redis_status: dict[str, Any] | None = None
        try:
            r = get_redis_client()
            cached = r.get(f"task_status:{task_id}")
            if cached:
                redis_status = json.loads(cached)
        except Exception as exc:
            logger.debug("Redis task status lookup failed: %s", exc)

        if redis_status:
            return Response(
                {
                    "task_id": task_id,
                    "status": redis_status.get("status", "QUEUED"),
                    "task_name": redis_status.get("task_name", "unknown"),
                    "progress": redis_status.get("progress", 0),
                    "result": redis_status.get("result"),
                    "error": redis_status.get("error"),
                },
                status=status.HTTP_200_OK,
            )

        # 2. Inspect Celery AsyncResult
        async_res = AsyncResult(task_id, app=celery_app)
        celery_state = async_res.state

        state_mapping = {
            "PENDING": "QUEUED",
            "RECEIVED": "QUEUED",
            "STARTED": "PROCESSING",
            "RETRY": "PROCESSING",
            "SUCCESS": "COMPLETED",
            "FAILURE": "FAILED",
            "REVOKED": "FAILED",
        }
        normalized_status = state_mapping.get(celery_state, "QUEUED")

        progress = 100 if normalized_status == "COMPLETED" else (0 if normalized_status == "QUEUED" else 50)
        res_data = None
        error_msg = None

        if celery_state == "SUCCESS":
            res_data = async_res.result if isinstance(async_res.result, dict) else {"result": str(async_res.result)}
        elif celery_state == "FAILURE":
            error_msg = str(async_res.result)

        # 3. Fallback to django_celery_results
        if normalized_status == "QUEUED" and not async_res.ready():
            try:
                from django_celery_results.models import TaskResult

                tr = TaskResult.objects.filter(task_id=task_id).first()
                if tr:
                    normalized_status = state_mapping.get(tr.status, tr.status)
                    if tr.status == "SUCCESS":
                        res_data = json.loads(tr.result) if tr.result else {}
                        progress = 100
                    elif tr.status == "FAILURE":
                        error_msg = tr.traceback or tr.result
                        progress = 100
            except Exception:
                pass

        return Response(
            {
                "task_id": task_id,
                "status": normalized_status,
                "progress": progress,
                "result": res_data,
                "error": error_msg,
            },
            status=status.HTTP_200_OK,
        )
