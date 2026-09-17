"""
Celery Background Tasks for Asynchronous AI Processing,
Knowledge Document Ingestion, Batch Evaluations, and Memory TTL Purging.
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger("celery.ai_tasks")


@shared_task(name="celery_tasks.ai_tasks.ingest_knowledge_document_async", queue="default")
def ingest_knowledge_document_async(guideline_id: str, title: str, organization: str, content: str) -> dict:
    """
    Asynchronously chunks, fingerprints, and indexes a clinical guideline into Neon PostgreSQL.
    """
    from apps.ai_orchestrator.models import KnowledgeDocument, KnowledgeDocumentVersion, KnowledgeChunk
    from ai.rag.chunking import ChunkingEngine

    logger.info("Starting async ingestion for guideline: %s", guideline_id)
    doc, _ = KnowledgeDocument.objects.update_or_create(
        guideline_id=guideline_id,
        defaults={
            "title": title,
            "organization": organization,
            "section": "Consensus",
            "recommendation": content[:1000],
            "is_approved": True,
        },
    )

    sha256 = ChunkingEngine.compute_sha256(content)
    version, _ = KnowledgeDocumentVersion.objects.update_or_create(
        document=doc,
        version="1.0",
        defaults={"content_hash": sha256, "status": "APPROVED"},
    )

    chunks = ChunkingEngine.chunk_document(guideline_id, content)
    for c in chunks:
        KnowledgeChunk.objects.update_or_create(
            document_version=version,
            guideline_id=guideline_id,
            chunk_index=c.chunk_index,
            defaults={
                "section_header": c.section_header,
                "chunk_text": c.text,
                "token_count": c.token_count,
                "metadata": c.metadata,
            },
        )

    logger.info("Successfully ingested %d chunks for guideline %s", len(chunks), guideline_id)
    return {"guideline_id": guideline_id, "chunks_created": len(chunks), "status": "SUCCESS"}


@shared_task(name="celery_tasks.ai_tasks.run_background_ai_benchmark", queue="default")
def run_background_ai_benchmark(benchmark_name: str, model_name: str, user_id: str) -> dict:
    """
    Runs automated safety and grounding regression benchmarks in the background.
    """
    from ai.evaluation.harness import AIEvaluationHarness

    logger.info("Executing background AI benchmark: %s with model %s", benchmark_name, model_name)
    metrics = AIEvaluationHarness.run_benchmark(benchmark_name=benchmark_name, model_name=model_name, user_id=user_id)
    return metrics


@shared_task(name="celery_tasks.ai_tasks.purge_expired_ai_memories_task", queue="default")
def purge_expired_ai_memories_task() -> int:
    """
    Periodic job to purge expired AI memory records.
    """
    from ai.memory.memory_platform import AIMemoryPlatform

    count = AIMemoryPlatform.purge_expired()
    logger.info("Periodic memory maintenance purged %d records", count)
    return count
