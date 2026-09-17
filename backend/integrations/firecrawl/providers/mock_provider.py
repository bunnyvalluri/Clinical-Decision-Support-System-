"""
Mock Provider for testing and CI. Strictly prohibited in production.
"""
import hashlib
import os
from typing import Any, Dict, List, Optional
from django.conf import settings

from ..exceptions import PolicyDeniedError
from ..schemas import (
    MapResponse,
    NormalizedDocument,
    SearchResponse,
    SearchResultItem,
    SourceTrustTier,
)
from .base import WebRetrievalProvider


class MockWebRetrievalProvider(WebRetrievalProvider):
    """
    Test-only mock provider with hard fail-fast in production.
    """

    def __init__(self) -> None:
        if settings.configured:
            env = getattr(settings, "ENVIRONMENT", None) or os.getenv("ENVIRONMENT", "development")
        else:
            env = os.getenv("ENVIRONMENT", "development")
        if env.lower() in ("production", "prod"):
            raise PolicyDeniedError("FATAL: MockWebRetrievalProvider cannot be instantiated in production environment.")

    def search(self, query: str, limit: int = 10, options: Optional[Dict[str, Any]] = None) -> SearchResponse:
        results = [
            SearchResultItem(
                title=f"Clinical Evidence: {query}",
                url="https://www.who.int/news-room/fact-sheets/detail/sepsis",
                snippet=f"Synthetic test snippet for query: {query}",
                markdown=f"# Clinical Evidence for {query}\n\nEvidence findings from peer-reviewed source.",
                content_hash=hashlib.sha256(b"mock_evidence").hexdigest(),
                relevance_score=0.95,
                trust_tier=SourceTrustTier.TIER_1,
                source_name="who.int",
            )
        ]
        return SearchResponse(query=query, results=results, total_count=1, duration_ms=2.5, provider="mock")

    def scrape(self, url: str, options: Optional[Dict[str, Any]] = None) -> NormalizedDocument:
        md = f"# Scraped Document from {url}\n\nThis is a mock scraped clinical document for test validation."
        return NormalizedDocument(
            url=url,
            canonical_url=url,
            title="Mock Scraped Article",
            markdown=md,
            html=f"<p>{md}</p>",
            description="Mock description",
            content_hash=hashlib.sha256(md.encode("utf-8")).hexdigest(),
            status_code=200,
            trust_tier=SourceTrustTier.TIER_1,
        )

    def map_url(self, url: str, search: Optional[str] = None, limit: int = 100) -> MapResponse:
        links = [f"{url}/page-1", f"{url}/page-2", f"{url}/guidelines"]
        return MapResponse(url=url, links=links, total_links=len(links), duration_ms=1.5)

    def start_crawl(self, url: str, options: Optional[Dict[str, Any]] = None) -> str:
        return "mock-crawl-uuid-1234"

    def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        return {
            "status": "completed",
            "total": 3,
            "completed": 3,
            "data": [
                {"url": "https://test.internal/page1", "markdown": "Page 1 Content"},
                {"url": "https://test.internal/page2", "markdown": "Page 2 Content"},
            ],
        }

    def cancel_crawl(self, job_id: str) -> bool:
        return True

    def extract(self, urls: List[str], schema: Dict[str, Any], prompt: Optional[str] = None) -> Dict[str, Any]:
        return {"extracted_data": {"condition": "Sepsis", "recommendation": "Early antibiotic administration"}}
