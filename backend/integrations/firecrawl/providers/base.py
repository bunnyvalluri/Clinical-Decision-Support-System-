"""
Abstract Provider Interface for Web Retrieval.
Decouples application business logic from specific search and scraping engines.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from ..schemas import MapResponse, NormalizedDocument, SearchResponse


class WebRetrievalProvider(ABC):
    """
    Contract for web retrieval providers.
    """

    @abstractmethod
    def search(self, query: str, limit: int = 10, options: Optional[Dict[str, Any]] = None) -> SearchResponse:
        """Executes web search and returns normalized results."""
        pass

    @abstractmethod
    def scrape(self, url: str, options: Optional[Dict[str, Any]] = None) -> NormalizedDocument:
        """Scrapes and normalizes single page content."""
        pass

    @abstractmethod
    def map_url(self, url: str, search: Optional[str] = None, limit: int = 100) -> MapResponse:
        """Discovers and maps URLs within a target site."""
        pass

    @abstractmethod
    def start_crawl(self, url: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Launches asynchronous crawl and returns upstream job ID."""
        pass

    @abstractmethod
    def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        """Polls status of upstream crawl job."""
        pass

    @abstractmethod
    def cancel_crawl(self, job_id: str) -> bool:
        """Requests cancellation of upstream crawl."""
        pass

    @abstractmethod
    def extract(self, urls: List[str], schema: Dict[str, Any], prompt: Optional[str] = None) -> Dict[str, Any]:
        """Executes structured JSON extraction."""
        pass
