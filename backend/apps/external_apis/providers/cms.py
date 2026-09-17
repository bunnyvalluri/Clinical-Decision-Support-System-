import logging
from typing import Any
import requests

from apps.external_apis.interfaces.client import ExternalAPIClient
from apps.external_apis.security.ssrf import validate_url_against_ssrf, check_phi_violation
from apps.external_apis.services.provenance import utc_iso_now

logger = logging.getLogger(__name__)


class CMSClient(ExternalAPIClient):
    """
    Adapter for Centers for Medicare & Medicaid Services (CMS) Open Data APIs.
    Provides quality payment program measures and national healthcare guidelines.
    """

    provider_name: str = "CMS Open Data"
    base_url: str = "https://data.cms.gov/data-api/v1"

    def __init__(self, timeout: int = 5) -> None:
        self.timeout = timeout
        self.session: requests.Session | None = None

    def connect(self) -> None:
        if self.session is None:
            self.session = requests.Session()

    def authenticate(self) -> dict[str, str]:
        return {}

    def request(
        self,
        endpoint: str = "dataset",
        params: dict[str, Any] | None = None,
        method: str = "GET",
    ) -> dict[str, Any]:
        self.connect()
        clean_endpoint = endpoint.lstrip("/")
        full_url = f"{self.base_url}/{clean_endpoint}"

        validate_url_against_ssrf(full_url, allowed_domains=["data.cms.gov"])
        if params:
            check_phi_violation(params)

        headers = {"User-Agent": "ClinicalDecisionSupport/BPY-CSE-2666"}

        try:
            resp = self.session.get(
                full_url,
                params=params,
                headers=headers,
                timeout=self.timeout,
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            logger.warning("CMS API request failed: %s", exc)
            raise

    def validate_response(self, response_data: dict[str, Any]) -> bool:
        return isinstance(response_data, (list, dict))

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Normalize CMS dataset response into canonical ExternalClinicalGuideline."""
        items = raw_data if isinstance(raw_data, list) else raw_data.get("data", [])
        if not items:
            return {
                "title": "CMS Quality Standards Reference",
                "publisher": "Centers for Medicare & Medicaid Services",
                "topic": "Clinical Quality Measures",
                "summary": "No specific measure details returned for query.",
                "url": "https://data.cms.gov",
                "retrieved_at": utc_iso_now(),
                "provider": "CMS Open Data",
            }

        first = items[0] if isinstance(items, list) else items
        return {
            "title": str(first.get("title", first.get("name", "CMS Clinical Quality Metric"))),
            "publisher": "Centers for Medicare & Medicaid Services",
            "topic": str(first.get("theme", first.get("category", "Quality Payment Program"))),
            "summary": str(first.get("description", "National quality reporting standard."))[:500],
            "url": str(first.get("landingPage", "https://data.cms.gov")),
            "retrieved_at": utc_iso_now(),
            "provider": "CMS Open Data",
        }

    def health_check(self) -> dict[str, Any]:
        try:
            self.connect()
            probe_url = f"{self.base_url}/dataset"
            validate_url_against_ssrf(probe_url, allowed_domains=["data.cms.gov"])
            resp = self.session.get(probe_url, params={"size": 1}, timeout=self.timeout)
            return {
                "provider": self.provider_name,
                "is_available": resp.status_code == 200,
                "status_code": resp.status_code,
                "latency_ms": resp.elapsed.total_seconds() * 1000,
                "checked_at": utc_iso_now(),
            }
        except Exception as exc:
            return {
                "provider": self.provider_name,
                "is_available": False,
                "status_code": 0,
                "error": str(exc),
                "checked_at": utc_iso_now(),
            }

    def close(self) -> None:
        if self.session:
            self.session.close()
            self.session = None
