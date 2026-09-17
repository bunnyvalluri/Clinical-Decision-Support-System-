import logging
from typing import Any
import requests

from apps.external_apis.interfaces.client import ExternalAPIClient
from apps.external_apis.security.ssrf import validate_url_against_ssrf, check_phi_violation
from apps.external_apis.services.provenance import utc_iso_now

logger = logging.getLogger(__name__)


class NPPESClient(ExternalAPIClient):
    """
    Adapter for CMS National Plan and Provider Enumeration System (NPPES).
    Validates physician credentials, NPI numbers, and clinical practice registries.
    """

    provider_name: str = "NPPES"
    base_url: str = "https://npiregistry.cms.hhs.gov/api"

    def __init__(self, timeout: int = 5) -> None:
        self.timeout = timeout
        self.session: requests.Session | None = None

    def connect(self) -> None:
        if self.session is None:
            self.session = requests.Session()

    def authenticate(self) -> dict[str, str]:
        # NPPES Registry is public and does not require API key authentication
        return {}

    def request(
        self,
        endpoint: str = "",
        params: dict[str, Any] | None = None,
        method: str = "GET",
    ) -> dict[str, Any]:
        self.connect()
        full_url = f"{self.base_url}/" if not endpoint else f"{self.base_url}/{endpoint.lstrip('/')}"

        validate_url_against_ssrf(full_url, allowed_domains=["npiregistry.cms.hhs.gov"])
        query_params = dict(params or {})
        query_params.setdefault("version", "2.1")
        check_phi_violation(query_params)

        headers = {"User-Agent": "ClinicalDecisionSupport/BPY-CSE-2666"}

        try:
            resp = self.session.get(
                full_url,
                params=query_params,
                headers=headers,
                timeout=self.timeout,
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            logger.warning("NPPES API request failed: %s", exc)
            raise

    def validate_response(self, response_data: dict[str, Any]) -> bool:
        return isinstance(response_data, dict) and ("result_count" in response_data or "results" in response_data)

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Normalize NPPES payload into canonical ExternalProviderInformation."""
        results = raw_data.get("results", [])
        if not results:
            return {
                "npi": "N/A",
                "provider_name": "Unknown",
                "specialty": "Unspecified",
                "practice_address": "N/A",
                "phone": "N/A",
                "status": "NOT_FOUND",
                "source": "NPPES Registry",
                "provider": "Centers for Medicare & Medicaid Services",
                "retrieved_at": utc_iso_now(),
            }

        item = results[0]
        basic = item.get("basic", {})
        addresses = item.get("addresses", [])
        taxonomies = item.get("taxonomies", [])

        primary_address = addresses[0] if addresses else {}
        specialty = taxonomies[0].get("desc", "General Healthcare") if taxonomies else "General"

        full_name = f"{basic.get('first_name', '')} {basic.get('last_name', '')}".strip() or basic.get("organization_name", "Unknown")

        addr_line = f"{primary_address.get('address_1', '')}, {primary_address.get('city', '')} {primary_address.get('state', '')} {primary_address.get('postal_code', '')}".strip()

        return {
            "npi": str(item.get("number", "N/A")),
            "provider_name": full_name,
            "credential": basic.get("credential", "MD"),
            "specialty": specialty,
            "practice_address": addr_line,
            "phone": primary_address.get("telephone_number", "N/A"),
            "enumeration_date": basic.get("enumeration_date", "N/A"),
            "status": "ACTIVE" if basic.get("status") == "A" else "INACTIVE",
            "source": "NPPES Registry",
            "provider": "Centers for Medicare & Medicaid Services",
            "retrieved_at": utc_iso_now(),
        }

    def health_check(self) -> dict[str, Any]:
        try:
            self.connect()
            probe_url = f"{self.base_url}/"
            validate_url_against_ssrf(probe_url, allowed_domains=["npiregistry.cms.hhs.gov"])
            resp = self.session.get(probe_url, params={"version": "2.1", "limit": 1}, timeout=self.timeout)
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
