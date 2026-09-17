"""
Ollama Operational Performance & Token Metrics Collector.
"""
import time
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class ModelMetricRecord:
    model_tag: str
    tokens_in: int
    tokens_out: int
    latency_ms: float
    timestamp: float = field(default_factory=time.time)

    @property
    def tokens_per_second(self) -> float:
        if self.latency_ms <= 0:
            return 0.0
        return round((self.tokens_out / (self.latency_ms / 1000.0)), 2)


class OllamaMetricsCollector:
    """
    In-memory windowed metric tracker for local Ollama performance.
    """

    _RECORDS: List[ModelMetricRecord] = []
    _MAX_RECORDS = 500

    @classmethod
    def record_inference(cls, model: str, tokens_in: int, tokens_out: int, latency_ms: float) -> None:
        rec = ModelMetricRecord(model_tag=model, tokens_in=tokens_in, tokens_out=tokens_out, latency_ms=latency_ms)
        cls._RECORDS.append(rec)
        if len(cls._RECORDS) > cls._MAX_RECORDS:
            cls._RECORDS.pop(0)

    @classmethod
    def get_summary(cls) -> Dict[str, Dict[str, float]]:
        summary: Dict[str, Dict[str, float]] = {}
        for rec in cls._RECORDS:
            if rec.model_tag not in summary:
                summary[rec.model_tag] = {
                    "total_requests": 0,
                    "total_tokens_in": 0,
                    "total_tokens_out": 0,
                    "avg_latency_ms": 0.0,
                    "avg_tps": 0.0,
                }
            s = summary[rec.model_tag]
            s["total_requests"] += 1
            s["total_tokens_in"] += rec.tokens_in
            s["total_tokens_out"] += rec.tokens_out
            s["avg_latency_ms"] += rec.latency_ms
            s["avg_tps"] += rec.tokens_per_second

        for model, s in summary.items():
            count = s["total_requests"]
            if count > 0:
                s["avg_latency_ms"] = round(s["avg_latency_ms"] / count, 2)
                s["avg_tps"] = round(s["avg_tps"] / count, 2)

        return summary
