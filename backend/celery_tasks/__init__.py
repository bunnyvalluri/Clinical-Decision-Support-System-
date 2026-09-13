"""
Celery tasks package.

All Celery task definitions live here, organised by domain.
Tasks are thin wrappers that delegate to service classes — no business
logic should be written directly inside a @shared_task function.

Task modules:
  celery_tasks.prediction_tasks  — Async ML prediction pipeline
  celery_tasks.report_tasks      — PDF/CSV report generation
  celery_tasks.notification_tasks — Email + WebSocket notification dispatch
  celery_tasks.ml_tasks          — Model training and evaluation
"""
