"""
Strongly-typed domain schemas for Web Intelligence requests and responses.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid


class SourceTrustTier(str, Enum):
    TIER_1 = "TIER_1"  # Official Govt / WHO / CDC / NIH / FDA
    TIER_2 = "TIER_2"  # Established Academic & Medical Institutions (Mayo, Johns Hopkins, NEJM, Lancet)
    TIER_3 = "TIER_3"  # General Reputable Medical & Scientific Media
    TIER_4 = "TIER_4"  # General Web / Unverified
    TIER_5 = "TIER_5"  # Blocked / Untrusted / Malicious


class WebJobStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    TIMEOUT = "TIMEOUT"


class ResearchMode(str, Enum):
    GENERAL_RESEARCH = "GENERAL_RESEARCH"
    MEDICAL_EVIDENCE = "MEDICAL_EVIDENCE"
    TECHNICAL_RESEARCH = "TECHNICAL_RESEARCH"
    ML_RESEARCH = "ML_RESEARCH"
    SECURITY_RESEARCH = "SECURITY_RESEARCH"
    ADMIN_RESEARCH = "ADMIN_RESEARCH"


@dataclass
class ScrapeOptions:
    formats: List[str] = field(default_factory=lambda: ["markdown"])
    only_main_content: bool = True
    include_tags: List[str] = field(default_factory=list)
    exclude_tags: List[str] = field(default_factory=list)
    wait_for: int = 0
    timeout: int = 30


@dataclass
class NormalizedDocument:
    url: str
    canonical_url: str
    title: str
    markdown: str
    html: Optional[str] = None
    description: Optional[str] = None
    content_hash: str = ""
    retrieved_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status_code: int = 200
    trust_tier: SourceTrustTier = SourceTrustTier.TIER_4
    citations: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchResultItem:
    title: str
    url: str
    snippet: str
    markdown: Optional[str] = None
    content_hash: str = ""
    relevance_score: float = 0.0
    trust_tier: SourceTrustTier = SourceTrustTier.TIER_4
    retrieved_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source_name: str = ""


@dataclass
class SearchResponse:
    query: str
    results: List[SearchResultItem]
    total_count: int
    duration_ms: float
    provider: str = "firecrawl"


@dataclass
class MapResponse:
    url: str
    links: List[str]
    total_links: int
    duration_ms: float


@dataclass
class CrawlJobProgress:
    job_id: str
    status: WebJobStatus
    total_pages: int
    completed_pages: int
    failure_count: int
    created_at: str
    updated_at: str
    error: Optional[str] = None
