"""
Unified Clinical Chat Engine with Guardrails, Context Budgeting, and Streaming Dispatch.
"""
import logging
import time
from typing import Any, Dict, Generator, List, Optional
import uuid

from django.utils import timezone
from .client import get_ollama_client
from .config import ollama_settings
from .exceptions import ContextBudgetExceededError, OllamaError
from .models import OllamaModelService
from .security import OllamaSecurityFilter

logger = logging.getLogger("integrations.ollama.chat")


class OllamaChatService:
    """
    Coordinates clinical chat sessions, enforces security & context budgeting,
    and handles both synchronous and streaming generation.
    """

    MAX_CONTEXT_CHAR_BUDGET = 64000  # Approx 16k tokens

    @classmethod
    def execute_chat(
        cls,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        user_role: Optional[str] = None,
        user_id: Optional[Any] = None,
        correlation_id: Optional[str] = None,
        temperature: Optional[float] = None,
        stream: bool = False,
    ) -> Dict[str, Any]:
        cid = correlation_id or str(uuid.uuid4())
        model_tag = model or ollama_settings.default_chat_model

        # 1. Model Policy & Approval Verification
        OllamaModelService.verify_model_approval(model_tag, user_role=user_role)

        # 2. Context Budget & PHI / Injection Security Scan
        total_chars = sum(len(m.get("content", "")) for m in messages)
        if total_chars > cls.MAX_CONTEXT_CHAR_BUDGET:
            raise ContextBudgetExceededError(
                f"Total context characters ({total_chars}) exceeds safety budget ({cls.MAX_CONTEXT_CHAR_BUDGET})."
            )

        sanitized_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            raw_content = msg.get("content", "")
            
            # Run security filter on user prompts
            if role == "user":
                OllamaSecurityFilter.validate_clinical_prompt(raw_content)
                cleaned = OllamaSecurityFilter.sanitize_phi(raw_content)
            else:
                cleaned = raw_content

            sanitized_messages.append({"role": role, "content": cleaned})

        # 3. Execution
        client = get_ollama_client()
        start_t = time.time()

        options = {
            "temperature": temperature if temperature is not None else ollama_settings.default_temperature,
            "seed": ollama_settings.default_seed,
        }

        resp = client.chat(
            messages=sanitized_messages,
            model=model_tag,
            options=options,
            stream=False,
            correlation_id=cid,
        )

        latency_ms = round((time.time() - start_t) * 1000.0, 2)
        message_out = resp.get("message", {})
        content_out = message_out.get("content", "")
        eval_count = resp.get("eval_count", len(content_out) // 4)
        prompt_eval_count = resp.get("prompt_eval_count", total_chars // 4)

        return {
            "correlation_id": cid,
            "model": model_tag,
            "role": message_out.get("role", "assistant"),
            "content": content_out,
            "tokens_in": prompt_eval_count,
            "tokens_out": eval_count,
            "latency_ms": latency_ms,
            "created_at": timezone.now().isoformat(),
        }

    @classmethod
    def execute_chat_stream(
        cls,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        user_role: Optional[str] = None,
        correlation_id: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> Generator[Dict[str, Any], None, None]:
        cid = correlation_id or str(uuid.uuid4())
        model_tag = model or ollama_settings.default_chat_model

        OllamaModelService.verify_model_approval(model_tag, user_role=user_role)

        sanitized_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                OllamaSecurityFilter.validate_clinical_prompt(content)
                cleaned = OllamaSecurityFilter.sanitize_phi(content)
            else:
                cleaned = content
            sanitized_messages.append({"role": role, "content": cleaned})

        client = get_ollama_client()
        options = {
            "temperature": temperature if temperature is not None else ollama_settings.default_temperature,
            "seed": ollama_settings.default_seed,
        }

        for chunk in client.chat_stream(
            messages=sanitized_messages,
            model=model_tag,
            options=options,
            correlation_id=cid,
        ):
            delta = chunk.get("message", {}).get("content", "")
            is_done = chunk.get("done", False)
            yield {
                "correlation_id": cid,
                "delta": delta,
                "done": is_done,
                "eval_count": chunk.get("eval_count", 0),
            }
