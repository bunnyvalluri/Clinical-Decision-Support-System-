"""
Corrective RAG (CRAG) Pipeline for Healthcare Decision Support.
Evaluates retrieval relevance, executes query refinement if ambiguous,
and yields INSUFFICIENT_APPROVED_INFORMATION if local guidelines lack coverage.
"""
import logging
import re
from typing import List, Tuple

from .retriever import HybridRetriever, RetrievalResult
from ai.domain.entities import GroundingStatus

logger = logging.getLogger("ai.rag.crag")


class CorrectiveRAGPipeline:
    """
    Implements Healthcare Corrective RAG:
    Retrieve -> Grade Relevance -> Refine if Inadequate -> Re-evaluate or Terminate with Safe State.
    """

    RELEVANCE_THRESHOLD = 0.015  # Minimum RRF score threshold

    @classmethod
    def execute(cls, query: str, top_k: int = 4) -> Tuple[List[RetrievalResult], GroundingStatus, str]:
        # Pass 1: Initial Hybrid Retrieval
        initial_results = HybridRetriever.retrieve(query, top_k=top_k)

        # Grade relevance
        if cls._is_sufficient(initial_results):
            return initial_results, GroundingStatus.GROUNDED, query

        # Pass 2: Medical Query Reformulation
        logger.info("CRAG: Retrieval score insufficient for query '%s'. Applying medical term normalization.", query)
        refined_query = cls._refine_query(query)
        secondary_results = HybridRetriever.retrieve(refined_query, top_k=top_k)

        if cls._is_sufficient(secondary_results):
            return secondary_results, GroundingStatus.PARTIALLY_GROUNDED, refined_query

        # Fallback: Merge both passes or return insufficient-evidence state
        merged = initial_results or secondary_results
        if merged:
            return merged, GroundingStatus.PARTIALLY_GROUNDED, refined_query

        logger.warning("CRAG: Zero matching approved guidelines for query: '%s'. Emitting safe insufficient state.", query)
        return [], GroundingStatus.UNSUPPORTED, refined_query

    @classmethod
    def _is_sufficient(cls, results: List[RetrievalResult]) -> bool:
        if not results:
            return False
        top_score = max(r.rrf_score for r in results)
        return top_score >= cls.RELEVANCE_THRESHOLD

    @classmethod
    def _refine_query(cls, query: str) -> str:
        """
        Normalizes colloquial expressions to standardized clinical terms.
        """
        replacements = [
            (r"\bheart attack\b", "acute coronary syndrome myocardial infarction"),
            (r"\bkidney failure\b", "acute kidney injury renal failure creatinine"),
            (r"\bblood poisoning\b", "sepsis septic shock lactate"),
            (r"\bhigh blood pressure\b", "hypertension mean arterial pressure"),
            (r"\blung trouble\b", "hypoxemic respiratory failure copd"),
            (r"\bsugar level\b", "glycemia blood glucose diabetes"),
        ]
        refined = query.lower()
        for pattern, replacement in replacements:
            refined = re.sub(pattern, replacement, refined)
        return refined
