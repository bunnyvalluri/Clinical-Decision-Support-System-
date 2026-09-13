# Background Tasks Catalog

| Task Name | Module Location | Purpose |
|---|---|---|
| `generate_pdf_report_task` | `apps.reports.tasks` | Compiles ReportLab PDF discharge summary |
| `process_bulk_predictions_task`| `apps.predictions.tasks`| Vectorized batch inference on cohort datasets |
| `send_notification_task` | `apps.notifications.tasks` | Asynchronous multi-channel alert delivery |
| `send_email_notification_task`| `apps.notifications.tasks` | SMTP clinical email alert dispatch |
| `compute_periodic_analytics_task`| `celery_tasks.scheduled_tasks`| Hourly cohort risk and calibration metrics aggregation |
