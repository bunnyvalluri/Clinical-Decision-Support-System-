"""
Data access repository layer for Jules models in Neon PostgreSQL.
"""
from typing import Optional, List
from django.utils import timezone
from integrations.jules.models import (
    JulesSource,
    JulesRemediationJob,
    JulesSession,
    JulesActivity,
    JulesArtifact,
    JulesApproval,
    JulesAuditEvent,
)


class JulesRepository:
    @staticmethod
    def get_source_by_name(external_name: str) -> Optional[JulesSource]:
        return JulesSource.objects.filter(external_name=external_name).first()

    @staticmethod
    def list_sources(enabled_only: bool = True) -> List[JulesSource]:
        qs = JulesSource.objects.all()
        if enabled_only:
            qs = qs.filter(enabled=True)
        return list(qs)

    @staticmethod
    def get_job_by_correlation_id(correlation_id: str) -> Optional[JulesRemediationJob]:
        return JulesRemediationJob.objects.filter(correlation_id=correlation_id).first()

    @staticmethod
    def get_active_job_for_issue(repository: str, branch: str, issue_category: str, issue_ref: str) -> Optional[JulesRemediationJob]:
        """Finds any non-terminal job to prevent duplicate sessions."""
        return (
            JulesRemediationJob.objects.filter(
                repository=repository,
                branch=branch,
                issue_category=issue_category,
                issue_reference=issue_ref,
            )
            .exclude(status__in=["COMPLETED", "FAILED", "CANCELLED", "REJECTED"])
            .first()
        )

    @staticmethod
    def get_session_by_external_id(external_session_id: str) -> Optional[JulesSession]:
        return JulesSession.objects.filter(external_session_id=external_session_id).first()

    @staticmethod
    def list_recent_activities(limit: int = 50) -> List[JulesActivity]:
        return list(JulesActivity.objects.select_related("jules_session").order_by("-created_at")[:limit])
