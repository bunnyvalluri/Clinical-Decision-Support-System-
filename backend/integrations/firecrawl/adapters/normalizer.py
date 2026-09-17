"""
Data Normalizer converting heterogeneous web responses into standardized domain models.
"""
import hashlib
from typing import Any, Dict, Optional
from ..policies import DomainPolicyEngine
from ..schemas import NormalizedDocument
from ..security import ContentSanitizer


class FirecrawlDataNormalizer:
    """
    Normalizes raw API responses from Firecrawl into strongly-typed NormalizedDocument objects.
    """

    @staticmethod
    def normalize_scrape_result(raw_item: Dict[str, Any], target_url: str) -> NormalizedDocument:
        markdown = raw_item.get("markdown", "")
        html = raw_item.get("html", "")
        metadata = raw_item.get("metadata", {})

        clean_md = ContentSanitizer.sanitize_markdown(markdown)
        clean_html = ContentSanitizer.sanitize_html(html)

        title = metadata.get("title") or metadata.get("ogTitle") or target_url
        description = metadata.get("description") or metadata.get("ogDescription")
        canonical = metadata.get("sourceURL") or target_url
        status_code = int(metadata.get("statusCode", 200))

        content_hash = hashlib.sha256(clean_md.encode("utf-8")).hexdigest() if clean_md else ""
        domain = DomainPolicyEngine.extract_domain(target_url)
        trust_tier = DomainPolicyEngine.classify_domain_tier(domain)

        return NormalizedDocument(
            url=target_url,
            canonical_url=canonical,
            title=title,
            markdown=clean_md,
            html=clean_html,
            description=description,
            content_hash=content_hash,
            status_code=status_code,
            trust_tier=trust_tier,
            metadata=metadata,
        )
