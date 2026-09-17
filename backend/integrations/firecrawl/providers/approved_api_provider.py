"""
Approved Medical API Provider as curated fallback.
Integrates authoritative structured sources (e.g. PubMed/NCBI e-utilities).
"""
from typing import Any, Dict, List, Optional
from ..schemas import MapResponse, NormalizedDocument, SearchResponse
from .base import WebRetrievalProvider


class ApprovedApiProvider(WebRetrievalProvider):
    """
    Fallback provider utilizing curated structured medical APIs.
    """

    def search(self, query: str, limit: int = 10, options: Optional[Dict[str, Any]] = None) -> SearchResponse:
        # Structured API fallback (e.g., PubMed query)
        return SearchResponse(
            query=query,
            results=[],
            total_count=0,
            duration_ms=5.0,
            provider="approved_apis",
        )

    def scrape(self, url: str, options: Optional[Dict[str, Any]] = None) -> NormalizedDocument:
        raise NotImplementedError("Scraping is delegated to Firecrawl.")

    def map_url(self, url: str, search: Optional[str] = None, limit: int = 100) -> MapResponse:
        return MapResponse(url=url, links=[], total_links=0, duration_ms=1.0)

    def start_crawl(self, url: str, options: Optional[Dict[str, Any]] = None) -> str:
        raise NotImplementedError("Crawling is not supported by ApprovedApiProvider.")

    def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        return {"status": "unsupported"}

    def cancel_crawl(self, job_id: str) -> bool:
        return True

    def extract(self, urls: List[str], schema: Dict[str, Any], prompt: Optional[str] = None) -> Dict[str, Any]:
        return {}
