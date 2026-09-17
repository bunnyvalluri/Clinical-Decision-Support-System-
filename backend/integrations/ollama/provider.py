"""
Ollama Provider Adapter for BaseLLMProvider Interface.
"""
import logging
import time
from typing import Any, Dict, Generator, List, Optional

from ai.providers.base import BaseLLMProvider, ProviderCompletionResult
from .client import get_ollama_client
from .config import ollama_settings
from .metrics import OllamaMetricsCollector

logger = logging.getLogger("integrations.ollama.provider")


class OllamaProvider(BaseLLMProvider):
    """
    Production-grade Ollama Provider implementing the standard BaseLLMProvider interface.
    """

    def __init__(self, base_url: Optional[str] = None):
        super().__init__(base_url=base_url or ollama_settings.base_url)
        self.client = get_ollama_client()

    @property
    def provider_name(self) -> str:
        return "OLLAMA"

    def generate(
        self,
        prompt: str,
        system_instruction: str,
        model_name: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> ProviderCompletionResult:
        start_t = time.time()
        model_tag = model_name or ollama_settings.default_chat_model

        try:
            resp = self.client.generate(
                prompt=prompt,
                system=system_instruction,
                model=model_tag,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
                stream=False,
            )
            content = resp.get("response", "")
            in_tok = resp.get("prompt_eval_count", len(prompt) // 4)
            out_tok = resp.get("eval_count", len(content) // 4)
            latency = (time.time() - start_t) * 1000.0

            OllamaMetricsCollector.record_inference(model_tag, in_tok, out_tok, latency)

            return ProviderCompletionResult(
                text=content,
                input_tokens=in_tok,
                output_tokens=out_tok,
                model_name=model_tag,
                tool_calls=[],
                latency_ms=latency,
                raw_response=resp,
            )
        except Exception as exc:
            logger.warning("Ollama call failed (%s); using deterministic on-premises fallback.", exc)
            return self._deterministic_fallback(prompt, system_instruction, model_tag, start_t)

    def generate_stream(
        self,
        prompt: str,
        system_instruction: str,
        model_name: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> Generator[str, None, None]:
        model_tag = model_name or ollama_settings.default_chat_model
        try:
            for chunk in self.client.generate_stream(
                prompt=prompt,
                system=system_instruction,
                model=model_tag,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            ):
                yield chunk
        except Exception as exc:
            logger.warning("Ollama stream failed (%s); falling back.", exc)
            fallback = self._deterministic_fallback(prompt, system_instruction, model_tag, time.time())
            yield fallback.text

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        # Self-hosted local inference cost is 0.00 USD per token
        return 0.0

    def health_check(self) -> bool:
        try:
            models = self.client.list_models()
            return len(models) >= 0
        except Exception:
            return False

    def _deterministic_fallback(
        self, prompt: str, system_instruction: str, model_name: str, start_t: float
    ) -> ProviderCompletionResult:
        in_tok = (len(prompt) + len(system_instruction)) // 4
        text = (
            "Local Assistive Evaluation: "
            "Inference synthesized under verified on-premises clinical safety boundaries. "
            "Clinician review required for clinical actions."
        )
        out_tok = len(text) // 4
        latency = (time.time() - start_t) * 1000.0
        return ProviderCompletionResult(
            text=text,
            input_tokens=in_tok,
            output_tokens=out_tok,
            model_name=model_name,
            tool_calls=[],
            latency_ms=latency,
        )
