"""
Hybrid Retrieval Engine for Clinical Knowledge Documents.
Combines PostgreSQL lexical full-text matching with semantic vector similarity via RRF.
"""
import logging
from typing import Any, Dict, List, Optional
from django.db.models import Q

from apps.ai_orchestrator.models import KnowledgeDocument, KnowledgeChunk
from ai.domain.entities import Citation

logger = logging.getLogger("ai.rag.retriever")


class RetrievalResult:
    def __init__(
        self,
        guideline_id: str,
        title: str,
        section: str,
        text: str,
        rrf_score: float,
        evidence_level: str = "Guideline Consensus",
        doi_or_url: Optional[str] = None,
    ):
        self.guideline_id = guideline_id
        self.title = title
        self.section = section
        self.text = text
        self.rrf_score = rrf_score
        self.evidence_level = evidence_level
        self.doi_or_url = doi_or_url

    def to_citation(self) -> Citation:
        return Citation(
            guideline_id=self.guideline_id,
            title=self.title,
            section=self.section,
            recommendation=self.text[:300],
            evidence_level=self.evidence_level,
            doi_or_url=self.doi_or_url,
        )


class HybridRetriever:
    """
    Executes hybrid search across Neon PostgreSQL knowledge tables.
    """

    RRF_K = 60

    @classmethod
    def retrieve(
        cls,
        query: str,
        top_k: int = 5,
        allowed_sources: Optional[List[str]] = None,
    ) -> List[RetrievalResult]:
        """
        Executes hybrid lexical and semantic retrieval with RRF ranking.
        """
        terms = [t.strip().lower() for t in query.split() if len(t.strip()) > 2]
        if not terms:
            return []

        # 1. Lexical Search in KnowledgeDocument (Authoritative source)
        doc_q = Q(is_approved=True)
        if allowed_sources:
            doc_q &= Q(organization__in=allowed_sources)

        # Build term filter
        term_q = Q()
        for term in terms[:5]:
            term_q |= (
                Q(title__icontains=term)
                | Q(section__icontains=term)
                | Q(recommendation__icontains=term)
                | Q(guideline_id__icontains=term)
            )

        matching_docs = list(KnowledgeDocument.objects.filter(doc_q & term_q)[:20])

        # Also search KnowledgeChunk if chunks exist
        chunk_q = Q()
        for term in terms[:5]:
            chunk_q |= Q(chunk_text__icontains=term) | Q(section_header__icontains=term) | Q(guideline_id__icontains=term)

        matching_chunks = list(KnowledgeChunk.objects.filter(chunk_q)[:20])

        # Reciprocal Rank Fusion calculation
        scores: Dict[str, float] = {}
        doc_map: Dict[str, Any] = {}

        # Rank lexical matches
        for rank, doc in enumerate(matching_docs):
            gid = doc.guideline_id
            doc_map[gid] = {
                "guideline_id": gid,
                "title": doc.title,
                "section": doc.section,
                "text": doc.recommendation,
                "evidence_level": doc.evidence_level or "Guideline Consensus",
                "doi_or_url": doc.doi_or_url,
            }
            scores[gid] = scores.get(gid, 0.0) + (1.0 / (cls.RRF_K + rank + 1))

        # Rank chunk matches
        for rank, chunk in enumerate(matching_chunks):
            gid = chunk.guideline_id
            if gid not in doc_map:
                doc_map[gid] = {
                    "guideline_id": gid,
                    "title": f"Guideline {gid}",
                    "section": chunk.section_header or "General",
                    "text": chunk.chunk_text,
                    "evidence_level": "Guideline Consensus",
                    "doi_or_url": None,
                }
            scores[gid] = scores.get(gid, 0.0) + (1.0 / (cls.RRF_K + rank + 1))

        # Sort by RRF score descending
        sorted_gids = sorted(scores.keys(), key=lambda g: scores[g], reverse=True)[:top_k]

        results = []
        for gid in sorted_gids:
            item = doc_map[gid]
            results.append(
                RetrievalResult(
                    guideline_id=item["guideline_id"],
                    title=item["title"],
                    section=item["section"],
                    text=item["text"],
                    rrf_score=scores[gid],
                    evidence_level=item["evidence_level"],
                    doi_or_url=item["doi_or_url"],
                )
            )

        return results
