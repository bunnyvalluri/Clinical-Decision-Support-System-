"""
Report generation Celery tasks package interface.
Re-exports tasks from apps.reports.tasks for modular discovery.
"""
from apps.reports.tasks import generate_pdf_report_task

# Backward compatible alias
generate_patient_report = generate_pdf_report_task

__all__ = ("generate_pdf_report_task", "generate_patient_report")
