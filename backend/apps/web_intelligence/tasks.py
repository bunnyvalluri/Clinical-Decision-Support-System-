"""
Celery Background Tasks for Asynchronous Web Intelligence Operations.
Authoritative state updates are committed to Neon PostgreSQL.
"""
import logging
import time
from typing import Any, Dict, List, Optional
from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from integrations.firecrawl.config import FirecrawlConfig
from integrations.firecrawl.service import WebIntelligenceService
from integrations.firecrawl.schemas import WebJobStatus
from .models import (
    JobStateChoices,
    WebCrawlJob,
    WebCrawlPage,
    WebDocument,
    WebExtraction,
    WebResearchSession,
    WebResearchSource,
)

logger = logging.getLogger("apps.firecrawl")


def _broadcast_job_event(event_type: str, job: WebCrawlJob) -> None:
    """Broadcasts job status event via Django Channels to ws/web/ listeners."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    payload = {
        "type": "web_job_event",
        "event": event_type,
        "job_id": str(job.id),
        "status": job.status,
        "total": job.total_pages,
        "completed": job.completed_pages,
        "failures": job.failure_count,
        "base_url": job.base_url,
        "timestamp": timezone.now().isoformat(),
    }
    try:
        async_to_sync(channel_layer.group_send)("web_intelligence", payload)
    except Exception as e:
        logger.warning(f"Failed to broadcast WebSocket event: {e}")


@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def execute_crawl_task(self, job_id: str) -> Dict[str, Any]:
    """
    Executes an asynchronous site crawl job via Celery.
    """
    try:
        job = WebCrawlJob.objects.get(id=job_id)
    except WebCrawlJob.DoesNotExist:
        logger.error(f"Crawl job {job_id} not found in database.")
        return {"status": "NOT_FOUND"}

    job.status = JobStateChoices.RUNNING
    job.save(update_fields=["status", "updated_at"])
    _broadcast_job_event("web.job.started", job)

    service = WebIntelligenceService()
    try:
        # Check cancellation
        job.refresh_from_db()
        if job.cancel_requested:
            job.status = JobStateChoices.CANCELLED
            job.save(update_fields=["status", "updated_at"])
            _broadcast_job_event("web.job.cancelled", job)
            return {"status": "CANCELLED"}

        # Perform crawl via provider
        map_res = service.map_website(job.base_url, role=job.role, limit=job.total_pages or 25)
        target_links = map_res.links[:job.total_pages or 25]
        job.total_pages = len(target_links)
        job.save(update_fields=["total_pages", "updated_at"])

        completed = 0
        failures = 0

        for link in target_links:
            job.refresh_from_db()
            if job.cancel_requested:
                job.status = JobStateChoices.CANCELLED
                job.save(update_fields=["status", "updated_at"])
                _broadcast_job_event("web.job.cancelled", job)
                return {"status": "CANCELLED"}

            try:
                doc = service.scrape_url(link, role=job.role)
                WebCrawlPage.objects.create(
                    job=job,
                    url=link,
                    title=doc.title,
                    status_code=doc.status_code,
                    content_hash=doc.content_hash,
                )
                # Store normalized document
                WebDocument.objects.update_or_create(
                    canonical_url=doc.canonical_url,
                    defaults={
                        "url": doc.url,
                        "title": doc.title,
                        "description": doc.description or "",
                        "markdown_content": doc.markdown,
                        "sanitized_html": doc.html or "",
                        "content_hash": doc.content_hash,
                        "status_code": doc.status_code,
                        "trust_tier": doc.trust_tier.value,
                        "retrieved_at": timezone.now(),
                    },
                )
                completed += 1
            except Exception as e:
                failures += 1
                WebCrawlPage.objects.create(
                    job=job,
                    url=link,
                    status_code=500,
                    error=str(e)[:500],
                )

            job.completed_pages = completed
            job.failure_count = failures
            job.save(update_fields=["completed_pages", "failure_count", "updated_at"])
            _broadcast_job_event("web.job.progress", job)
            time.sleep(0.1)  # Rate pacing

        job.status = JobStateChoices.COMPLETED if failures == 0 else JobStateChoices.PARTIAL
        job.save(update_fields=["status", "updated_at"])
        _broadcast_job_event("web.job.completed", job)
        return {"status": job.status, "completed": completed, "failures": failures}

    except Exception as exc:
        logger.error(f"Fatal error executing crawl {job_id}: {exc}")
        job.status = JobStateChoices.FAILED
        job.error_message = str(exc)[:500]
        job.save(update_fields=["status", "error_message", "updated_at"])
        _broadcast_job_event("web.job.failed", job)
        return {"status": "FAILED", "error": str(exc)}


@shared_task
def execute_batch_scrape_task(urls: List[str], role: str, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Executes bounded batch scraping across multiple URLs.
    """
    service = WebIntelligenceService()
    results = []
    for u in urls:
        try:
            doc = service.scrape_url(u, role=role)
            results.append({"url": u, "status": "SUCCESS", "title": doc.title, "hash": doc.content_hash})
        except Exception as e:
            results.append({"url": u, "status": "ERROR", "error": str(e)})
    return {"total": len(urls), "results": results}


@shared_task
def execute_research_session_task(session_id: str) -> Dict[str, Any]:
    """
    Coordinates multi-step evidence research for clinical or technical queries.
    """
    try:
        session = WebResearchSession.objects.get(id=session_id)
    except WebResearchSession.DoesNotExist:
        return {"status": "NOT_FOUND"}

    service = WebIntelligenceService()
    try:
        search_res = service.search(session.query, role=session.role, limit=5)
        citation_num = 1
        findings_parts = [f"Synthesized Evidence Findings for '{session.query}':\n"]

        for item in search_res.results:
            WebResearchSource.objects.create(
                session=session,
                citation_number=citation_num,
                source_title=item.title,
                source_url=item.url,
                relevance_score=item.relevance_score,
            )
            findings_parts.append(
                f"[{citation_num}] **{item.title}** ({item.source_name})\n{item.snippet}\n"
            )
            citation_num += 1

        session.findings = "\n".join(findings_parts)
        session.uncertainty_notes = "Evidence derived from external web literature. Requires clinical correlation."
        session.limitations = "Subject to publication date and guideline revision intervals."
        session.status = "COMPLETED"
        session.completed_at = timezone.now()
        session.save()

        # Broadcast completion
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "web_intelligence",
                {
                    "type": "web_job_event",
                    "event": "web.research.completed",
                    "session_id": str(session.id),
                    "status": "COMPLETED",
                },
            )

        return {"status": "COMPLETED", "sources": citation_num - 1}

    except Exception as e:
        session.status = "FAILED"
        session.findings = f"Evidence research failed: {e}"
        session.save()
        return {"status": "FAILED", "error": str(e)}


@shared_task
def cleanup_expired_jobs_task() -> int:
    """Nightly maintenance task removing crawl pages older than 30 days."""
    cutoff = timezone.now() - timezone.timedelta(days=30)
    deleted, _ = WebCrawlPage.objects.filter(created_at__lt=cutoff).delete()
    logger.info(f"Cleaned up {deleted} expired crawl page records.")
    return deleted
