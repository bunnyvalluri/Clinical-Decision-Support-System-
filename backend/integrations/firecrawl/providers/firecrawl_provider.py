"""
Production Firecrawl Provider implementing WebRetrievalProvider.
"""
import hashlib
import time
from typing import Any, Dict, List, Optional
from ..client import FirecrawlClient
from ..config import FirecrawlConfig
from ..policies import DomainPolicyEngine
from ..schemas import (
    MapResponse,
    NormalizedDocument,
    SearchResponse,
    SearchResultItem,
    SourceTrustTier,
)
from ..security import ContentSanitizer
from .base import WebRetrievalProvider


class FirecrawlProvider(WebRetrievalProvider):
    """
    Implements WebRetrievalProvider using Firecrawl REST API.
    """

    def __init__(self, client: Optional[FirecrawlClient] = None):
        self.client = client or FirecrawlClient()

    def search(self, query: str, limit: int = 10, options: Optional[Dict[str, Any]] = None) -> SearchResponse:
        start_time = time.time()
        raw_res = self.client.search(query, limit=limit, options=options)

        results: List[SearchResultItem] = []
        raw_items = raw_res.get("data", []) if isinstance(raw_res, dict) else []

        for item in raw_items:
            url = item.get("url", "")
            title = item.get("title", "")
            snippet = item.get("description") or item.get("markdown", "")[:300]
            markdown = item.get("markdown", "")
            clean_md = ContentSanitizer.sanitize_markdown(markdown)
            domain = DomainPolicyEngine.extract_domain(url)
            trust_tier = DomainPolicyEngine.classify_domain_tier(domain)

            content_hash = hashlib.sha256(clean_md.encode("utf-8")).hexdigest() if clean_md else ""

            results.append(
                SearchResultItem(
                    title=title,
                    url=url,
                    snippet=snippet,
                    markdown=clean_md,
                    content_hash=content_hash,
                    relevance_score=float(item.get("score", 0.0) or 0.0),
                    trust_tier=trust_tier,
                    source_name=domain,
                )
            )

        duration = (time.time() - start_time) * 1000
        return SearchResponse(
            query=query,
            results=results,
            total_count=len(results),
            duration_ms=duration,
            provider="firecrawl",
        )

    def scrape(self, url: str, options: Optional[Dict[str, Any]] = None) -> NormalizedDocument:
        raw_res = self.client.scrape(url, options=options)
        data = raw_res.get("data", {}) if isinstance(raw_res, dict) else {}

        raw_md = data.get("markdown", "")
        clean_md = ContentSanitizer.sanitize_markdown(raw_md)
        raw_html = data.get("html", "")
        clean_html = ContentSanitizer.sanitize_html(raw_html)

        metadata = data.get("metadata", {})
        title = metadata.get("title") or metadata.get("ogTitle") or url
        description = metadata.get("description") or metadata.get("ogDescription")
        status_code = metadata.get("statusCode", 200)

        domain = DomainPolicyEngine.extract_domain(url)
        trust_tier = DomainPolicyEngine.classify_domain_tier(domain)
        content_hash = hashlib.sha256(clean_md.encode("utf-8")).hexdigest()

        return NormalizedDocument(
            url=url,
            canonical_url=metadata.get("sourceURL") or url,
            title=title,
            markdown=clean_md,
            html=clean_html,
            description=description,
            content_hash=content_hash,
            status_code=status_code,
            trust_tier=trust_tier,
            metadata=metadata,
        )

    def map_url(self, url: str, search: Optional[str] = None, limit: int = 100) -> MapResponse:
        start_time = time.time()
        raw_res = self.client.map_url(url, search=search, limit=limit)
        links = raw_res.get("links", []) if isinstance(raw_res, dict) else []
        duration = (time.time() - start_time) * 1000

        return MapResponse(
            url=url,
            links=links,
            total_links=len(links),
            duration_ms=duration,
        )

    def start_crawl(self, url: str, options: Optional[Dict[str, Any]] = None) -> str:
        raw_res = self.client.crawl(url, options=options)
        return str(raw_res.get("id", ""))

    def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        return self.client.get_crawl_status(job_id)

    def cancel_crawl(self, job_id: str) -> bool:
        res = self.client.cancel_crawl(job_id)
        return bool(res.get("success", True))

    def extract(self, urls: List[str], schema: Dict[str, Any], prompt: Optional[str] = None) -> Dict[str, Any]:
        return self.client.extract(urls, schema, prompt=prompt)
