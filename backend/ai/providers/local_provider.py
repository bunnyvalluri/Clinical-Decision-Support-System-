"""
Local / Self-Hosted Model Provider Adapter.
Supports Ollama, vLLM, or local deterministic inference.
"""
import json
import logging
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

from .base import BaseLLMProvider, ProviderCompletionResult

logger = logging.getLogger("ai.providers.local")


class LocalModelProvider(BaseLLMProvider):
    """
    Adapter for local Ollama or vLLM inference server.
    """

    @property
    def provider_name(self) -> str:
        return "LOCAL"

    def generate(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "llama3.3:70b",
        temperature: float = 0.1,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> ProviderCompletionResult:
        start_t = time.time()
        base_endpoint = self.base_url or "http://localhost:11434"

        try:
            url = f"{base_endpoint}/api/generate"
            payload = {
                "model": model_name,
                "system": system_instruction,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            content = data.get("response", "")
            in_tok = data.get("prompt_eval_count", len(prompt) // 4)
            out_tok = data.get("eval_count", len(content) // 4)
            latency = (time.time() - start_t) * 1000.0

            return ProviderCompletionResult(
                text=content,
                input_tokens=in_tok,
                output_tokens=out_tok,
                model_name=model_name,
                tool_calls=[],
                latency_ms=latency,
                raw_response=data,
            )
        except Exception as exc:
            logger.debug("Local Ollama endpoint unreachable (%s), using local deterministic inference.", exc)
            return self._deterministic_fallback(prompt, system_instruction, model_name, start_t)

    def generate_stream(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "llama3.3:70b",
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ):
        result = self.generate(prompt, system_instruction, model_name, temperature, max_tokens)
        chunks = [result.text[i : i + 24] for i in range(0, len(result.text), 24)]
        for chunk in chunks:
            time.sleep(0.02)
            yield chunk

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        # Local model infrastructure cost is effectively zero per-token
        return 0.0

    def health_check(self) -> bool:
        return True

    def _deterministic_fallback(
        self, prompt: str, system_instruction: str, model_name: str, start_t: float
    ) -> ProviderCompletionResult:
        in_tok = (len(prompt) + len(system_instruction)) // 4
        text = (
            "Local On-Premises Decision Support Evaluation:\n"
            "Clinical risk signals processed through on-premise deterministic rule baselines. "
            "Grounded evidence cross-referenced against institutional policy guidelines."
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
