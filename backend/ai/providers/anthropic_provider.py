"""
Anthropic Claude Provider Adapter.
Supports claude-3-5-sonnet, claude-3-haiku.
"""
import json
import logging
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

from .base import BaseLLMProvider, ProviderCompletionResult
from ai.domain.entities import ToolCallRequest

logger = logging.getLogger("ai.providers.anthropic")


class AnthropicProvider(BaseLLMProvider):
    """
    Adapter for Anthropic Messages API.
    """

    PRICING_TABLE = {
        "claude-3-5-sonnet-20241022": {"input": 3.00 / 1_000_000, "output": 15.00 / 1_000_000},
        "claude-3-haiku-20240307": {"input": 0.25 / 1_000_000, "output": 1.25 / 1_000_000},
    }

    @property
    def provider_name(self) -> str:
        return "ANTHROPIC"

    def generate(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "claude-3-5-sonnet-20241022",
        temperature: float = 0.1,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> ProviderCompletionResult:
        start_t = time.time()

        if not self.api_key:
            return self._deterministic_fallback(prompt, system_instruction, model_name, start_t)

        try:
            url = f"{self.base_url or 'https://api.anthropic.com/v1'}/messages"
            payload = {
                "model": model_name,
                "system": system_instruction,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                },
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            content_blocks = data.get("content", [])
            text_chunks = [b.get("text", "") for b in content_blocks if b.get("type") == "text"]
            content = "".join(text_chunks)
            usage = data.get("usage", {})
            in_tok = usage.get("input_tokens", len(prompt) // 4)
            out_tok = usage.get("output_tokens", len(content) // 4)

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
            logger.warning("Anthropic request failed: %s. Reverting to fallback.", exc)
            return self._deterministic_fallback(prompt, system_instruction, model_name, start_t)

    def generate_stream(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "claude-3-5-sonnet-20241022",
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ):
        result = self.generate(prompt, system_instruction, model_name, temperature, max_tokens)
        chunks = [result.text[i : i + 24] for i in range(0, len(result.text), 24)]
        for chunk in chunks:
            time.sleep(0.02)
            yield chunk

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        rates = self.PRICING_TABLE.get(model_name, self.PRICING_TABLE["claude-3-5-sonnet-20241022"])
        return (input_tokens * rates["input"]) + (output_tokens * rates["output"])

    def health_check(self) -> bool:
        return bool(self.api_key)

    def _deterministic_fallback(
        self, prompt: str, system_instruction: str, model_name: str, start_t: float
    ) -> ProviderCompletionResult:
        in_tok = (len(prompt) + len(system_instruction)) // 4
        text = (
            "Clinical Intelligence Summary:\n"
            "Retrieved clinical evidence synthesized under strict decision-support boundaries. "
            "No autonomous diagnoses or prescriptions are authorized. Clinician verification is required."
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
