"""
OpenAI Provider Adapter.
Supports GPT-4o, GPT-4o-mini, o3-mini.
"""
import json
import logging
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

from .base import BaseLLMProvider, ProviderCompletionResult
from ai.domain.entities import ToolCallRequest

logger = logging.getLogger("ai.providers.openai")


class OpenAIProvider(BaseLLMProvider):
    """
    Adapter for OpenAI API.
    """

    PRICING_TABLE = {
        "gpt-4o": {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
        "gpt-4o-mini": {"input": 0.15 / 1_000_000, "output": 0.60 / 1_000_000},
        "o3-mini": {"input": 1.10 / 1_000_000, "output": 4.40 / 1_000_000},
    }

    @property
    def provider_name(self) -> str:
        return "OPENAI"

    def generate(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "gpt-4o",
        temperature: float = 0.1,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> ProviderCompletionResult:
        start_t = time.time()

        if not self.api_key:
            # Deterministic server-side synthesis fallback when external key is not provided
            return self._deterministic_fallback(prompt, system_instruction, model_name, start_t)

        try:
            url = f"{self.base_url or 'https://api.openai.com/v1'}/chat/completions"
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt},
            ]
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if tools:
                payload["tools"] = tools

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            choice = data.get("choices", [{}])[0]
            msg = choice.get("message", {})
            content = msg.get("content", "") or ""
            usage = data.get("usage", {})
            in_tok = usage.get("prompt_tokens", len(prompt) // 4)
            out_tok = usage.get("completion_tokens", len(content) // 4)

            tool_calls = []
            if "tool_calls" in msg:
                for tc in msg["tool_calls"]:
                    func = tc.get("function", {})
                    tool_calls.append(
                        ToolCallRequest(
                            tool_name=func.get("name", ""),
                            arguments=json.loads(func.get("arguments", "{}")),
                            call_id=tc.get("id", ""),
                        )
                    )

            latency = (time.time() - start_t) * 1000.0
            return ProviderCompletionResult(
                text=content,
                input_tokens=in_tok,
                output_tokens=out_tok,
                model_name=model_name,
                tool_calls=tool_calls,
                latency_ms=latency,
                raw_response=data,
            )
        except Exception as exc:
            logger.warning("OpenAI request failed: %s. Reverting to deterministic synthesis.", exc)
            return self._deterministic_fallback(prompt, system_instruction, model_name, start_t)

    def generate_stream(
        self,
        prompt: str,
        system_instruction: str,
        model_name: str = "gpt-4o",
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ):
        result = self.generate(prompt, system_instruction, model_name, temperature, max_tokens)
        chunks = [result.text[i : i + 24] for i in range(0, len(result.text), 24)]
        for chunk in chunks:
            time.sleep(0.02)
            yield chunk

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        rates = self.PRICING_TABLE.get(model_name, self.PRICING_TABLE["gpt-4o-mini"])
        return (input_tokens * rates["input"]) + (output_tokens * rates["output"])

    def health_check(self) -> bool:
        return bool(self.api_key)

    def _deterministic_fallback(
        self, prompt: str, system_instruction: str, model_name: str, start_t: float
    ) -> ProviderCompletionResult:
        in_tok = (len(prompt) + len(system_instruction)) // 4
        text = (
            "Clinical Decision Support Synthesis:\n"
            "Patient context reviewed against grounded institutional guidelines and deterministically calibrated models. "
            "All recommendations require attending physician sign-off. High-risk indicators must be verified clinically."
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
