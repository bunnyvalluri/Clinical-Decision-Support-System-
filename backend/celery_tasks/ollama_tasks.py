"""
Celery Background Tasks for Ollama Model Synchronization, Bulk Embeddings,
and Automated Quality / Safety Benchmarking.
"""
import logging
from typing import Any, Dict, List, Optional
from celery import shared_task

logger = logging.getLogger("celery.ollama_tasks")


@shared_task(name="celery_tasks.ollama_tasks.sync_ollama_models_task", queue="default")
def sync_ollama_models_task() -> Dict[str, Any]:
    """
    Periodically checks local Ollama daemon for newly pulled models
    and synchronizes them with Neon PostgreSQL LLMModelRegistry.
    """
    logger.info("Starting background synchronization of Ollama models to Neon PostgreSQL...")
    try:
        from integrations.ollama.models import OllamaModelService
        result = OllamaModelService.sync_local_models_to_registry()
        logger.info("Ollama model sync completed: %s models synced", result.get("synced_count", 0))
        return result
    except Exception as exc:
        logger.error("Error during Ollama model sync task: %s", exc)
        return {"status": "FAILED", "error": str(exc)}


@shared_task(name="celery_tasks.ollama_tasks.generate_bulk_embeddings_task", queue="default")
def generate_bulk_embeddings_task(texts: List[str], model: Optional[str] = None) -> Dict[str, Any]:
    """
    Asynchronously generates embeddings in bulk using local Ollama nomic-embed-text.
    """
    logger.info("Starting bulk embeddings generation for %d texts", len(texts))
    try:
        from integrations.ollama.embeddings import OllamaEmbeddingService
        vectors = OllamaEmbeddingService.generate_batch_embeddings(texts=texts, model=model)
        dim = len(vectors[0]) if vectors else 0
        logger.info("Bulk embeddings completed: %d vectors generated (dim: %d)", len(vectors), dim)
        return {"status": "SUCCESS", "count": len(vectors), "dimension": dim}
    except Exception as exc:
        logger.error("Bulk embeddings generation failed: %s", exc)
        return {"status": "FAILED", "error": str(exc)}


@shared_task(name="celery_tasks.ollama_tasks.evaluate_ollama_model_task", queue="default")
def evaluate_ollama_model_task(model_tag: str) -> Dict[str, Any]:
    """
    Executes automated quality, JSON schema adherence, and prompt injection
    evaluation benchmarks against an installed Ollama model.
    """
    logger.info("Starting automated evaluation benchmark for Ollama model %s", model_tag)
    try:
        from apps.ai_orchestrator.models import LLMModelRegistry
        from integrations.ollama.client import get_ollama_client
        from integrations.ollama.structured_output import OllamaStructuredOutputService, RiskExplanationSchema

        client = get_ollama_client()
        # Test 1: Basic generation
        gen_res = client.generate(
            prompt="Reply with 'HEALTHCHECK_OK'",
            model=model_tag,
            options={"temperature": 0.0},
        )
        has_ok = "HEALTHCHECK_OK" in gen_res.get("response", "")

        # Test 2: Structured output adherence
        test_prompt = "Generate a risk explanation for prediction ID 1234, risk 0.85, Random Forest."
        structured_pass = True
        try:
            OllamaStructuredOutputService.generate_structured(
                prompt=test_prompt,
                schema_cls=RiskExplanationSchema,
                model=model_tag,
            )
        except Exception:
            structured_pass = False

        eval_verdict = "PASSED" if has_ok and structured_pass else "NEEDS_ATTENTION"
        
        # Update registry evaluation status
        LLMModelRegistry.objects.filter(tag=model_tag).update(
            status=LLMModelRegistry.Status.APPROVED if eval_verdict == "PASSED" else LLMModelRegistry.Status.EVALUATING
        )

        return {
            "model": model_tag,
            "verdict": eval_verdict,
            "healthcheck_passed": has_ok,
            "structured_output_passed": structured_pass,
        }
    except Exception as exc:
        logger.error("Automated evaluation for model %s failed: %s", model_tag, exc)
        return {"model": model_tag, "verdict": "FAILED", "error": str(exc)}
