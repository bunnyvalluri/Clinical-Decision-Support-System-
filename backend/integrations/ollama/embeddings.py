"""
High-Efficiency Local Embeddings Generation & Dimension Verification.
"""
import logging
import math
from typing import Any, Dict, List, Optional

from .client import get_ollama_client
from .config import ollama_settings
from .exceptions import OllamaError

logger = logging.getLogger("integrations.ollama.embeddings")


class OllamaEmbeddingService:
    """
    Generates high-dimensional vector embeddings for clinical documents, guidelines,
    and notes using local Ollama embedding models (e.g. nomic-embed-text:latest).
    """

    EXPECTED_DIMENSIONS = {
        "nomic-embed-text:latest": 768,
        "nomic-embed-text": 768,
        "bge-m3:latest": 1024,
        "bge-m3": 1024,
        "all-minilm:latest": 384,
        "all-minilm": 384,
    }

    @classmethod
    def generate_embedding(
        cls,
        text: str,
        model: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> List[float]:
        """
        Generate embedding vector for a single text chunk with dimension check.
        """
        model_tag = model or ollama_settings.default_embedding_model
        client = get_ollama_client()

        # Sanitize text
        clean_text = text.strip().replace("\x00", "")
        if not clean_text:
            return []

        vector = client.embeddings(prompt=clean_text, model=model_tag, correlation_id=correlation_id)

        # Validate vector integrity
        expected_dim = cls.EXPECTED_DIMENSIONS.get(model_tag)
        if expected_dim and len(vector) != expected_dim:
            logger.warning(
                "Embedding dimension mismatch for %s: expected %s, got %s",
                model_tag,
                expected_dim,
                len(vector),
            )

        return vector

    @classmethod
    def generate_batch_embeddings(
        cls,
        texts: List[str],
        model: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> List[List[float]]:
        """
        Generate embeddings sequentially or batch with dimension checks.
        """
        results = []
        for text in texts:
            vec = cls.generate_embedding(text, model=model, correlation_id=correlation_id)
            results.append(vec)
        return results

    @classmethod
    def cosine_similarity(cls, vec_a: List[float], vec_b: List[float]) -> float:
        """
        Calculates cosine similarity between two float vectors.
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0

        return dot / (norm_a * norm_b)
