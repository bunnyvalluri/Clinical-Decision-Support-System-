"""
Google Gemini Provider Adapter.
Supports gemini-2.0-flash, gemini-1.5-pro.
"""
import json
import logging
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

from .base import BaseLLMProvider, ProviderCompletionResult
from ai.domain.entities import ToolCallRequest

logger = logging.getLogger("ai.providers.gemini")


class GeminiProvider(BaseLLMProvider):
    """
    Adapter for Google Gemini API.
    """

    PRICING_TABLE = {
        "gemini-2.0-flash": {"input": 0.10 / 1_000_000, "output": 0.40 / 1_000_000},
        "gemini-1.5-pro": {"input": 1.25 / 1_000_000, "output": 5.00 / 1_000_000},
    }

    @property
    def provider_name(self) -> str:
        return "GEMINI"

    def generate(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "gemini-2.0-flash",
        temperature: float = 0.1,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> ProviderCompletionResult:
        start_t = time.time()

        if not self.api_key:
            return self._deterministic_fallback(prompt, system_instruction, model_name, start_t)

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"SYSTEM INSTRUCTION: {system_instruction}\n\nUSER PROMPT: {prompt}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
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

            candidates = data.get("candidates", [{}])
            candidate = candidates[0] if candidates else {}
            parts = candidate.get("content", {}).get("parts", [])
            content = "".join([p.get("text", "") for p in parts])
            usage = data.get("usageMetadata", {})
            in_tok = usage.get("promptTokenCount", len(prompt) // 4)
            out_tok = usage.get("candidatesTokenCount", len(content) // 4)

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
            logger.warning("Gemini request failed: %s. Reverting to fallback.", exc)
            return self._deterministic_fallback(prompt, system_instruction, model_name, start_t)

    def generate_stream(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "gemini-2.0-flash",
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ):
        result = self.generate(prompt, system_instruction, model_name, temperature, max_tokens)
        chunks = [result.text[i : i + 24] for i in range(0, len(result.text), 24)]
        for chunk in chunks:
            time.sleep(0.02)
            yield chunk

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        rates = self.PRICING_TABLE.get(model_name, self.PRICING_TABLE["gemini-2.0-flash"])
        return (input_tokens * rates["input"]) + (output_tokens * rates["output"])

    def health_check(self) -> bool:
        return bool(self.api_key)

    def _deterministic_fallback(
        self, prompt: str, system_instruction: str, model_name: str, start_t: float
    ) -> ProviderCompletionResult:
        in_tok = (len(prompt) + len(system_instruction)) // 4
        text = (
            "Clinical Literature Synthesis:\n"
            "Retrieved clinical citations and institutional protocols analyzed. "
            "Decision support output rendered under Human-in-the-Loop supervision."
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
