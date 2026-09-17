"""
Citation Grounding & Verification Engine.
Verifies that claims in AI responses correspond to retrieved clinical evidence.
"""
from typing import List, Tuple
from ai.domain.entities import Citation, GroundingStatus
from .retriever import RetrievalResult


class CitationGrounder:
    """
    Validates that claims map to cited clinical sources and computes a grounding score.
    """

    @classmethod
    def verify_grounding(
        cls,
        response_text: str,
        retrieved_docs: List[RetrievalResult],
    ) -> Tuple[GroundingStatus, float, List[Citation]]:
        if not retrieved_docs:
            return GroundingStatus.UNSUPPORTED, 0.0, []

        citations = [doc.to_citation() for doc in retrieved_docs]

        # Calculate grounding overlap: check presence of key clinical entities or guideline identifiers
        lower_text = response_text.lower()
        matched_count = 0

        for doc in retrieved_docs:
            gid = doc.guideline_id.lower()
            title_words = [w.lower() for w in doc.title.split() if len(w) > 4]
            if gid in lower_text or any(w in lower_text for w in title_words):
                matched_count += 1

        confidence = matched_count / len(retrieved_docs) if retrieved_docs else 0.0

        if confidence >= 0.60:
            status = GroundingStatus.GROUNDED
        elif confidence >= 0.25:
            status = GroundingStatus.PARTIALLY_GROUNDED
        else:
            status = GroundingStatus.UNSUPPORTED

        return status, max(0.40, confidence), citations
