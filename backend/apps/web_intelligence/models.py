"""
Authoritative PostgreSQL models for Firecrawl Web Intelligence.
Authoritative source of truth: Neon PostgreSQL.
"""
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class DomainStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Approval"
    APPROVED = "APPROVED", "Approved"
    BLOCKED = "BLOCKED", "Blocked"
    EXPIRED = "EXPIRED", "Expired"


class TrustTierChoices(models.TextChoices):
    TIER_1 = "TIER_1", "Tier 1: Government & Regulatory Health Authority"
    TIER_2 = "TIER_2", "Tier 2: Academic & Peer-Reviewed Institution"
    TIER_3 = "TIER_3", "Tier 3: Reputable Health Media"
    TIER_4 = "TIER_4", "Tier 4: General Web / Unverified"
    TIER_5 = "TIER_5", "Tier 5: Blocked / Untrusted"


class JobStateChoices(models.TextChoices):
    QUEUED = "QUEUED", "Queued"
    RUNNING = "RUNNING", "Running"
    COMPLETED = "COMPLETED", "Completed"
    PARTIAL = "PARTIAL", "Partial Success"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"
    TIMEOUT = "TIMEOUT", "Timeout"


class ResearchModeChoices(models.TextChoices):
    GENERAL_RESEARCH = "GENERAL_RESEARCH", "General Research"
    MEDICAL_EVIDENCE = "MEDICAL_EVIDENCE", "Medical Evidence Mode"
    TECHNICAL_RESEARCH = "TECHNICAL_RESEARCH", "Technical Research"
    ML_RESEARCH = "ML_RESEARCH", "Machine Learning Research"
    SECURITY_RESEARCH = "SECURITY_RESEARCH", "Security Research"
    ADMIN_RESEARCH = "ADMIN_RESEARCH", "Admin Research"


class ClinicianReviewStatus(models.TextChoices):
    UNREVIEWED = "UNREVIEWED", "Unreviewed"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    ACCEPTED = "ACCEPTED", "Accepted by Clinician"
    REJECTED = "REJECTED", "Rejected by Clinician"
    REQUIRES_ADDITIONAL_EVIDENCE = "REQUIRES_ADDITIONAL_EVIDENCE", "Requires Additional Evidence"


class DomainPolicy(models.Model):
    """
    Registry of domain approvals, trust tiers, and access rules.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    domain = models.CharField(max_length=255, unique=True, db_index=True)
    category = models.CharField(max_length=128, default="Medical Literature")
    trust_tier = models.CharField(
        max_length=16,
        choices=TrustTierChoices.choices,
        default=TrustTierChoices.TIER_4,
        db_index=True,
    )
    status = models.CharField(
        max_length=16,
        choices=DomainStatus.choices,
        default=DomainStatus.APPROVED,
        db_index=True,
    )
    allowed_roles = models.JSONField(default=list, help_text="List of roles permitted to query this domain.")
    reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "web_domain_policies"
        ordering = ["domain"]

    def __str__(self) -> str:
        return f"{self.domain} [{self.trust_tier}] - {self.status}"


class WebSource(models.Model):
    """
    Canonical source repository tracked for freshness and health.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, db_index=True)
    base_url = models.URLField(max_length=1024)
    trust_tier = models.CharField(max_length=16, choices=TrustTierChoices.choices, default=TrustTierChoices.TIER_4)
    freshness_ttl_hours = models.IntegerField(default=168, help_text="TTL in hours before source is flagged stale.")
    last_retrieved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "web_sources"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.domain})"


class WebDocument(models.Model):
    """
    Cached and normalized web document with cryptographic SHA-256 hash.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.ForeignKey(WebSource, on_delete=models.SET_NULL, null=True, blank=True, related_name="documents")
    url = models.URLField(max_length=2048, db_index=True)
    canonical_url = models.URLField(max_length=2048, db_index=True)
    title = models.CharField(max_length=512, blank=True, default="")
    description = models.TextField(blank=True, default="")
    markdown_content = models.TextField(blank=True, default="")
    sanitized_html = models.TextField(blank=True, default="")
    content_hash = models.CharField(max_length=64, db_index=True, help_text="SHA-256 hash of markdown content.")
    status_code = models.IntegerField(default=200)
    trust_tier = models.CharField(max_length=16, choices=TrustTierChoices.choices, default=TrustTierChoices.TIER_4)
    sensitivity_tier = models.CharField(max_length=32, default="PUBLIC")
    metadata = models.JSONField(default=dict, blank=True)
    retrieved_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "web_documents"
        indexes = [
            models.Index(fields=["content_hash", "canonical_url"]),
            models.Index(fields=["trust_tier", "retrieved_at"]),
        ]
        ordering = ["-retrieved_at"]

    def __str__(self) -> str:
        return f"{self.title or self.url} ({self.content_hash[:8]})"


class WebRetrieval(models.Model):
    """
    Audit log of individual search or single-page retrieval transactions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=64, default="DOCTOR")
    query = models.CharField(max_length=1024, blank=True, default="")
    method = models.CharField(max_length=32, default="SEARCH")  # SEARCH, SCRAPE, MAP
    target_url = models.URLField(max_length=2048, blank=True, default="")
    result_count = models.IntegerField(default=0)
    status = models.CharField(max_length=32, default="SUCCESS")
    duration_ms = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "web_retrievals"
        ordering = ["-created_at"]


class WebCrawlJob(models.Model):
    """
    Authoritative state machine for asynchronous crawl and batch jobs.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    upstream_job_id = models.CharField(max_length=128, blank=True, default="", db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=64, default="DOCTOR")
    base_url = models.URLField(max_length=2048)
    status = models.CharField(
        max_length=32,
        choices=JobStateChoices.choices,
        default=JobStateChoices.QUEUED,
        db_index=True,
    )
    total_pages = models.IntegerField(default=0)
    completed_pages = models.IntegerField(default=0)
    failure_count = models.IntegerField(default=0)
    idempotency_key = models.CharField(max_length=128, blank=True, default="", db_index=True)
    cancel_requested = models.BooleanField(default=False)
    options = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "web_crawl_jobs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"CrawlJob {self.id} [{self.status}] - {self.base_url}"


class WebCrawlPage(models.Model):
    """
    Individual page outcome for a crawl job.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(WebCrawlJob, on_delete=models.CASCADE, related_name="pages")
    url = models.URLField(max_length=2048)
    title = models.CharField(max_length=512, blank=True, default="")
    status_code = models.IntegerField(default=200)
    content_hash = models.CharField(max_length=64, blank=True, default="")
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "web_crawl_pages"
        ordering = ["created_at"]


class WebExtraction(models.Model):
    """
    Structured JSON extraction conforming to schema.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=64, default="DOCTOR")
    target_urls = models.JSONField(default=list)
    schema_definition = models.JSONField(default=dict)
    extracted_data = models.JSONField(default=dict)
    validation_status = models.CharField(max_length=32, default="VALIDATED")
    confidence_score = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "web_extractions"
        ordering = ["-created_at"]


class WebResearchSession(models.Model):
    """
    Evidence research session with human clinician review workflow.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=64, default="DOCTOR")
    query = models.TextField()
    mode = models.CharField(
        max_length=32,
        choices=ResearchModeChoices.choices,
        default=ResearchModeChoices.MEDICAL_EVIDENCE,
        db_index=True,
    )
    status = models.CharField(max_length=32, default="COMPLETED")
    findings = models.TextField(blank=True, default="")
    uncertainty_notes = models.TextField(blank=True, default="")
    limitations = models.TextField(blank=True, default="")
    conflicting_evidence = models.TextField(blank=True, default="")
    clinician_review_status = models.CharField(
        max_length=32,
        choices=ClinicianReviewStatus.choices,
        default=ClinicianReviewStatus.UNREVIEWED,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_research_sessions",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, default="")
    policy_version = models.CharField(max_length=32, default="1.0.0")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "web_research_sessions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"ResearchSession {self.id} ({self.mode}) - {self.clinician_review_status}"


class WebResearchSource(models.Model):
    """
    Citations linking a research session to retrieved web documents.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(WebResearchSession, on_delete=models.CASCADE, related_name="sources")
    document = models.ForeignKey(WebDocument, on_delete=models.SET_NULL, null=True, blank=True)
    citation_number = models.IntegerField(default=1)
    source_title = models.CharField(max_length=512)
    source_url = models.URLField(max_length=2048)
    relevance_score = models.FloatField(default=0.0)

    class Meta:
        db_table = "web_research_sources"
        ordering = ["citation_number"]


class WebResearchResult(models.Model):
    """
    Synthesized final result and summary for a research session.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(WebResearchSession, on_delete=models.CASCADE, related_name="result")
    summary = models.TextField()
    evidence_quality = models.CharField(max_length=64, default="MODERATE")
    conflict_detected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "web_research_results"
        ordering = ["-created_at"]


class WebContentVersion(models.Model):
    """
    Document version history for change tracking and auditability.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(WebDocument, on_delete=models.CASCADE, related_name="versions")
    version_number = models.IntegerField(default=1)
    content_hash = models.CharField(max_length=64)
    markdown_content = models.TextField()
    diff_summary = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "web_content_versions"
        ordering = ["-version_number"]


class WebContentAudit(models.Model):
    """
    Immutable audit trail for all web intelligence requests and security decisions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=64, default="ANONYMOUS")
    operation = models.CharField(max_length=64, db_index=True)  # SEARCH, SCRAPE, CRAWL, SSRF_BLOCK, etc.
    target_url = models.CharField(max_length=2048, blank=True, default="")
    domain = models.CharField(max_length=255, blank=True, default="")
    decision = models.CharField(max_length=32, default="ALLOWED")  # ALLOWED, BLOCKED, RATE_LIMITED
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "web_content_audits"
        ordering = ["-timestamp"]
