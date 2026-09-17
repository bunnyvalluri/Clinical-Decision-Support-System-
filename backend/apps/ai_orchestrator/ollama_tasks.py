"""
Re-export of Ollama Celery tasks for ai_orchestrator package.
"""
from celery_tasks.ollama_tasks import (
    evaluate_ollama_model_task,
    generate_bulk_embeddings_task,
    sync_ollama_models_task,
)

__all__ = [
    "sync_ollama_models_task",
    "generate_bulk_embeddings_task",
    "evaluate_ollama_model_task",
]
