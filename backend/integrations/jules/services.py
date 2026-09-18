"""
Business orchestration services for Google Jules Engineering Automation.
Coordinates Source synchronization, Remediation Jobs, Session lifecycles, and Human Approvals.
"""
import uuid
import logging
from typing import Dict, Any, List, Optional
from django.utils import timezone
from django.db import transaction

from integrations.jules.models import (
    JulesSource,
    JulesRemediationJob,
    JulesSession,
    JulesActivity,
    JulesArtifact,
    JulesApproval,
    JulesSessionState,
    RemediationJobStatus,
    RemediationSeverity,
    RemediationIssueCategory,
    RemediationTriggerType,
    ApprovalType,
    ApprovalStatus,
)
from integrations.jules.config import get_jules_settings
from integrations.jules.adapters import get_jules_client
from integrations.jules.policies import JulesPolicyEngine, PolicyDecision
from integrations.jules.prompt_builder import JulesPromptBuilder
from integrations.jules.validators import JulesValidator
from integrations.jules.audit import JulesAuditLogger
from integrations.jules.repositories import JulesRepository
from integrations.jules.exceptions import JulesPolicyViolationError, JulesValidationError

logger = logging.getLogger("jules.services")


class JulesSourceSyncService:
    @classmethod
    def sync_sources(cls, actor_id: str = "SYSTEM") -> List[JulesSource]:
        """
        Polls Google Jules /v1alpha/sources and synchronizes allowed repositories to Neon PostgreSQL.
        """
        client = get_jules_client()
        settings = get_jules_settings()

        response = client.list_sources()
        raw_sources = response.get("sources", [])
        synced_sources = []

        with transaction.atomic():
            for s in raw_sources:
                ext_name = s.get("name", "")
                src_id = s.get("id", ext_name.split("/")[-1])
                gh_info = s.get("githubRepo", {})
                owner = gh_info.get("owner", "")
                repo = gh_info.get("repo", "")
                is_priv = gh_info.get("isPrivate", True)
                def_branch = gh_info.get("defaultBranch", "main")
                branches = gh_info.get("branches", ["main", "develop"])

                # Check if repo is allowed
                is_allowed = True
                if settings.allowed_repositories:
                    is_allowed = any(r.lower() in repo.lower() for r in settings.allowed_repositories)

                source_obj, created = JulesSource.objects.update_or_create(
                    external_name=ext_name,
                    defaults={
                        "source_id": src_id,
                        "provider": "github",
                        "github_owner": owner,
                        "github_repository": repo,
                        "is_private": is_priv,
                        "default_branch": def_branch,
                        "available_branches": branches,
                        "enabled": is_allowed,
                        "last_synced_at": timezone.now(),
                    },
                )
                synced_sources.append(source_obj)

            JulesAuditLogger.record(
                action="SYNC_SOURCES",
                resource_type="JulesSource",
                resource_id=str(len(synced_sources)),
                actor_id=actor_id,
                metadata={"count": len(synced_sources)},
            )

        return synced_sources


class JulesRemediationService:
    @classmethod
    def create_remediation_job(
        cls,
        title: str,
        issue_category: str,
        description: str,
        repository: str = "HealthNova-AI",
        branch: str = "develop",
        trigger_type: str = RemediationTriggerType.MANUAL,
        severity: str = RemediationSeverity.MEDIUM,
        issue_reference: str = "",
        affected_files: Optional[List[str]] = None,
        error_log: str = "",
        created_by: Any = None,
        actor_role: str = "IT_ADMIN",
    ) -> JulesRemediationJob:
        """
        Creates a new controlled remediation job with deduplication and policy checks.
        """
        # 1. Deduplication check: Do not create duplicate jobs for the same open issue
        if issue_reference:
            existing = JulesRepository.get_active_job_for_issue(repository, branch, issue_category, issue_reference)
            if existing:
                logger.info("Reusing existing active remediation job %s for %s", existing.correlation_id, issue_reference)
                return existing

        # 2. Policy Evaluation
        decision = JulesPolicyEngine.evaluate(
            repository=repository,
            branch=branch,
            issue_category=issue_category,
            severity=severity,
            user_role=actor_role,
            affected_files=affected_files,
        )
        if decision == PolicyDecision.DENY:
            raise JulesPolicyViolationError(
                f"Remediation job denied by safety policy for {repository}:{branch} ({issue_category})"
            )

        correlation_id = f"HN-JULES-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        status = RemediationJobStatus.AUTHORIZED if decision == PolicyDecision.ALLOW else RemediationJobStatus.PENDING_AUTHORIZATION

        job = JulesRemediationJob.objects.create(
            correlation_id=correlation_id,
            repository=repository,
            branch=branch,
            trigger_type=trigger_type,
            issue_category=issue_category,
            issue_reference=issue_reference,
            title=title,
            description=description,
            severity=severity,
            status=status,
            created_by=created_by,
            validation_output={"affected_files": affected_files or [], "error_log": error_log[:2000]},
        )

        JulesAuditLogger.record(
            action="CREATE_REMEDIATION_JOB",
            resource_type="JulesRemediationJob",
            resource_id=job.correlation_id,
            actor_id=getattr(created_by, "email", "SYSTEM"),
            correlation_id=correlation_id,
            metadata={"decision": decision.value, "severity": severity, "category": issue_category},
        )

        # If allowed automatically, launch session creation
        if status == RemediationJobStatus.AUTHORIZED:
            cls.start_session_for_job(job, actor_id=getattr(created_by, "email", "SYSTEM"))

        return job

    @classmethod
    def start_session_for_job(cls, job: JulesRemediationJob, actor_id: str = "SYSTEM") -> JulesSession:
        """
        Builds the structured prompt, calls Jules /v1alpha/sessions, and establishes the local session record.
        """
        settings = get_jules_settings()
        client = get_jules_client()

        # Resolve Source
        source = JulesSource.objects.filter(github_repository__icontains=job.repository.split("/")[-1], enabled=True).first()
        source_name = source.external_name if source else f"sources/github/{job.repository}"

        # Generate Structured Sanitized Prompt
        files = job.validation_output.get("affected_files", [])
        log = job.validation_output.get("error_log", "")
        prompt = JulesPromptBuilder.build_prompt(
            repository=job.repository,
            branch=job.branch,
            title=job.title,
            issue_category=job.issue_category,
            description=job.description,
            error_log=log,
            affected_files=files,
        )

        # Call Jules API
        resp = client.create_session(
            prompt=prompt,
            source_name=source_name,
            starting_branch=job.branch,
            title=f"Fix: {job.title}",
            require_plan_approval=settings.require_plan_approval,
            automation_mode="AUTO_CREATE_PR" if settings.auto_create_pr else "NONE",
            correlation_id=job.correlation_id,
        )

        ext_session_id = resp.get("name", "")
        session_state = JulesSessionState.PLAN_PENDING_APPROVAL if settings.require_plan_approval else JulesSessionState.EXECUTING

        session = JulesSession.objects.create(
            external_session_id=ext_session_id,
            remediation_job=job,
            title=f"Fix: {job.title}",
            prompt=prompt,
            repository=job.repository,
            branch=job.branch,
            state=session_state,
            automation_mode="AUTO_CREATE_PR" if settings.auto_create_pr else "NONE",
            require_plan_approval=settings.require_plan_approval,
            created_by=job.created_by,
            started_at=timezone.now(),
        )

        job.status = RemediationJobStatus.PLAN_PENDING_APPROVAL if settings.require_plan_approval else RemediationJobStatus.EXECUTING
        job.source = source
        job.save(update_fields=["status", "source", "updated_at"])

        # Initial Activity Record
        JulesActivity.objects.create(
            jules_session=session,
            activity_type="SESSION_CREATED",
            originator="SYSTEM",
            description=f"Jules remediation session dispatched ({ext_session_id}).",
            metadata={"correlation_id": job.correlation_id},
        )

        JulesAuditLogger.record(
            action="START_SESSION",
            resource_type="JulesSession",
            resource_id=ext_session_id,
            actor_id=actor_id,
            correlation_id=job.correlation_id,
        )

        return session

    @classmethod
    def approve_plan(cls, job: JulesRemediationJob, approver_user: Any, reason: str = "") -> JulesApproval:
        """
        Approves a Jules remediation plan and signals the Jules API to proceed with code execution.
        """
        session = getattr(job, "session", None)
        if not session or not session.external_session_id:
            raise JulesValidationError("Cannot approve plan: No active Jules session exists for this job.")

        client = get_jules_client()
        client.approve_plan(session.external_session_id, correlation_id=job.correlation_id)

        session.state = JulesSessionState.EXECUTING
        session.save(update_fields=["state", "updated_at"])

        job.status = RemediationJobStatus.EXECUTING
        job.approved_by = approver_user
        job.save(update_fields=["status", "approved_by", "updated_at"])

        approval = JulesApproval.objects.create(
            remediation_job=job,
            approval_type=ApprovalType.PLAN_EXECUTION,
            requested_by=job.created_by,
            approved_by=approver_user,
            status=ApprovalStatus.APPROVED,
            reason=reason or "Approved by authorized IT Administrator.",
        )

        JulesActivity.objects.create(
            jules_session=session,
            activity_type="PLAN_APPROVED",
            originator="USER",
            description=f"Remediation plan approved by {getattr(approver_user, 'email', 'Admin')}.",
            metadata={"reason": reason},
        )

        JulesAuditLogger.record(
            action="APPROVE_PLAN",
            resource_type="JulesApproval",
            resource_id=str(approval.id),
            actor_id=getattr(approver_user, "email", "ADMIN"),
            correlation_id=job.correlation_id,
            metadata={"reason": reason},
        )

        return approval

    @classmethod
    def send_session_message(cls, session: JulesSession, message: str, sender: Any) -> JulesActivity:
        """Sends instructional guidance to an active Jules session."""
        client = get_jules_client()
        clean_msg = message.strip()
        if not clean_msg:
            raise JulesValidationError("Message cannot be empty.")

        client.send_message(session.external_session_id, clean_msg, correlation_id=session.remediation_job.correlation_id)

        activity = JulesActivity.objects.create(
            jules_session=session,
            activity_type="MESSAGE",
            originator="USER",
            description=clean_msg,
            metadata={"sender": getattr(sender, "email", "User")},
        )

        JulesAuditLogger.record(
            action="SEND_MESSAGE",
            resource_type="JulesSession",
            resource_id=session.external_session_id,
            actor_id=getattr(sender, "email", "USER"),
            correlation_id=session.remediation_job.correlation_id,
        )
        return activity

    @classmethod
    def sync_session_activities(cls, session: JulesSession) -> List[JulesActivity]:
        """Polls upstream Jules activities and updates session state."""
        if not session.external_session_id:
            return []

        client = get_jules_client()
        resp = client.list_activities(session.external_session_id)
        raw_acts = resp.get("activities", [])
        saved_acts = []

        for act in raw_acts:
            act_name = act.get("name", "")
            act_type = act.get("activityType", "PROGRESS")
            desc = act.get("description", "")
            orig = act.get("originator", "JULES")

            obj, created = JulesActivity.objects.get_or_create(
                jules_session=session,
                external_activity_id=act_name,
                defaults={
                    "activity_type": act_type,
                    "originator": orig,
                    "description": desc,
                    "metadata": act,
                },
            )
            saved_acts.append(obj)

        return saved_acts
