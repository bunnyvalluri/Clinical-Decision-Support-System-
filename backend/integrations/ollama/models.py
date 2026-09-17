"""
Model Catalog, Capability Profiles, and Synchronization with Neon PostgreSQL Registry.
"""
import logging
from typing import Any, Dict, List, Optional
from django.utils import timezone

from .client import get_ollama_client
from .exceptions import ModelNotApprovedError, ModelNotFoundError

logger = logging.getLogger("integrations.ollama.models")

# Known calibrated model profiles
MODEL_PROFILES = {
    "llama3.3:8b-instruct-q4_K_M": {
        "family": "llama",
        "parameters": "8B",
        "context_length": 8192,
        "capabilities": ["chat", "structured_output", "tool_calling"],
        "license": "Llama 3.3 Community License",
        "vram_gb": 8,
        "recommended_roles": ["DOCTOR", "CLINICAL_INFORMATICIST", "ADMIN"],
    },
    "llama3.3:70b-instruct-q4_K_M": {
        "family": "llama",
        "parameters": "70B",
        "context_length": 16384,
        "capabilities": ["chat", "structured_output", "tool_calling"],
        "license": "Llama 3.3 Community License",
        "vram_gb": 40,
        "recommended_roles": ["DOCTOR", "ADMIN"],
    },
    "qwen2.5:7b-instruct-q4_K_M": {
        "family": "qwen2",
        "parameters": "7B",
        "context_length": 8192,
        "capabilities": ["chat", "structured_output", "tool_calling"],
        "license": "Apache-2.0",
        "vram_gb": 8,
        "recommended_roles": ["DOCTOR", "NURSE", "CLINICAL_INFORMATICIST", "ADMIN"],
    },
    "mistral:7b-instruct-v0.3": {
        "family": "mistral",
        "parameters": "7B",
        "context_length": 8192,
        "capabilities": ["chat", "structured_output", "tool_calling"],
        "license": "Apache-2.0",
        "vram_gb": 8,
        "recommended_roles": ["DOCTOR", "CLINICAL_INFORMATICIST"],
    },
    "deepseek-r1:8b": {
        "family": "deepseek",
        "parameters": "8B",
        "context_length": 8192,
        "capabilities": ["chat", "structured_output"],
        "license": "MIT",
        "vram_gb": 8,
        "recommended_roles": ["DOCTOR", "CLINICAL_INFORMATICIST"],
    },
    "nomic-embed-text:latest": {
        "family": "nomic-bert",
        "parameters": "137M",
        "context_length": 8192,
        "capabilities": ["embeddings"],
        "license": "Apache-2.0",
        "dimension": 768,
        "vram_gb": 2,
        "recommended_roles": ["DOCTOR", "NURSE", "CLINICAL_INFORMATICIST", "ADMIN"],
    },
    "bge-m3:latest": {
        "family": "xlm-roberta",
        "parameters": "567M",
        "context_length": 8192,
        "capabilities": ["embeddings"],
        "license": "Apache-2.0",
        "dimension": 1024,
        "vram_gb": 4,
        "recommended_roles": ["DOCTOR", "NURSE", "CLINICAL_INFORMATICIST", "ADMIN"],
    },
}


class OllamaModelService:
    """
    Manages discovery, database synchronization, and policy gate checking for Ollama models.
    """

    @classmethod
    def sync_local_models_to_registry(cls) -> Dict[str, Any]:
        """
        Queries Ollama daemon and upserts discovered models into Neon PostgreSQL LLMModelRegistry.
        """
        client = get_ollama_client()
        discovered = client.list_models()
        from apps.ai_orchestrator.models import LLMModelRegistry

        synced_count = 0
        details = []

        for m in discovered:
            model_tag = m.get("name", "")
            if not model_tag:
                continue

            profile = MODEL_PROFILES.get(model_tag, {})
            capabilities = profile.get("capabilities", ["chat"])
            context_len = profile.get("context_length", 4096)
            license_id = profile.get("license", "Open Source")
            allowed_roles = profile.get("recommended_roles", ["CLINICAL_INFORMATICIST", "ADMIN"])

            reg, created = LLMModelRegistry.objects.get_or_create(
                tag=model_tag,
                defaults={
                    "name": model_tag.split(":")[0],
                    "provider": "OLLAMA",
                    "runtime": "LOCAL_CONTAINER",
                    "context_length": context_len,
                    "capabilities": capabilities,
                    "license": license_id,
                    "status": LLMModelRegistry.Status.DISCOVERED if created else LLMModelRegistry.Status.APPROVED,
                    "approved_roles": allowed_roles,
                    "data_classification": "RESTRICTED_PHI",
                    "parameters_summary": {
                        "size_bytes": m.get("size", 0),
                        "digest": m.get("digest", "")[:12],
                        "details": m.get("details", {}),
                    },
                },
            )
            if not created:
                reg.updated_at = timezone.now()
                reg.parameters_summary = {
                    "size_bytes": m.get("size", 0),
                    "digest": m.get("digest", "")[:12],
                    "details": m.get("details", {}),
                }
                reg.save(update_fields=["updated_at", "parameters_summary"])

            synced_count += 1
            details.append({"tag": model_tag, "created": created, "status": reg.status})

        return {"synced_count": synced_count, "models": details}

    @classmethod
    def verify_model_approval(cls, model_tag: str, user_role: Optional[str] = None) -> None:
        """
        Enforces that model exists and is APPROVED / ACTIVE in Neon PostgreSQL.
        """
        from apps.ai_orchestrator.models import LLMModelRegistry

        try:
            reg = LLMModelRegistry.objects.get(tag=model_tag)
        except LLMModelRegistry.DoesNotExist:
            # Check if it exists with prefix or fallback
            reg = LLMModelRegistry.objects.filter(tag__startswith=model_tag).first()
            if not reg:
                raise ModelNotFoundError(f"Model '{model_tag}' is not registered in LLMModelRegistry.")

        if reg.status not in (LLMModelRegistry.Status.APPROVED, LLMModelRegistry.Status.ACTIVE):
            raise ModelNotApprovedError(
                f"Model '{model_tag}' status is '{reg.status}'. Only APPROVED or ACTIVE models can process clinical inference."
            )

        if user_role and reg.approved_roles:
            role_norm = user_role.upper()
            if role_norm not in [r.upper() for r in reg.approved_roles] and role_norm != "ADMIN":
                raise ModelNotApprovedError(
                    f"User role '{user_role}' is not authorized to invoke model '{model_tag}'."
                )
