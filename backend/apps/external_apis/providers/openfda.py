import logging
import os
from typing import Any
import requests

from apps.external_apis.interfaces.client import ExternalAPIClient
from apps.external_apis.security.ssrf import validate_url_against_ssrf, check_phi_violation
from apps.external_apis.services.provenance import utc_iso_now

logger = logging.getLogger(__name__)


class OpenFDAClient(ExternalAPIClient):
    """
    Adapter for openFDA Drug Endpoints (U.S. Food and Drug Administration).
    Retrieves official drug labeling, contraindications, and adverse reaction summaries.
    """

    provider_name: str = "openFDA"
    base_url: str = "https://api.fda.gov/drug"

    def __init__(self, timeout: int = 5) -> None:
        self.timeout = timeout
        self.session: requests.Session | None = None

    def connect(self) -> None:
        if self.session is None:
            self.session = requests.Session()

    def authenticate(self) -> dict[str, str]:
        api_key = os.getenv("EXTERNAL_API_OPENFDA_KEY")
        if api_key:
            return {"Authorization": f"Basic {api_key}"}
        return {}

    def request(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
        method: str = "GET",
    ) -> dict[str, Any]:
        self.connect()
        clean_endpoint = endpoint.lstrip("/")
        full_url = f"{self.base_url}/{clean_endpoint}"

        # 1. SSRF & PHI Security Checks
        validate_url_against_ssrf(full_url, allowed_domains=["api.fda.gov"])
        if params:
            check_phi_violation(params)

        headers = self.authenticate()
        headers["User-Agent"] = "ClinicalDecisionSupport/BPY-CSE-2666"

        try:
            resp = self.session.get(
                full_url,
                params=params,
                headers=headers,
                timeout=self.timeout,
            )
            if resp.status_code == 404:
                return {"results": [], "total": 0, "status": "NOT_FOUND"}
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            logger.warning("OpenFDA request failed: %s", exc)
            raise

    def validate_response(self, response_data: dict[str, Any]) -> bool:
        if not isinstance(response_data, dict):
            return False
        return "results" in response_data or "meta" in response_data

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Normalize openFDA payload into canonical ExternalDrugInformation."""
        results = raw_data.get("results", [])
        if not results:
            return {
                "name": "Unknown",
                "identifier": "N/A",
                "manufacturer": "N/A",
                "indications": "No official FDA drug label information returned.",
                "warnings": "None documented in query result.",
                "active_ingredients": [],
                "source": "openFDA",
                "provider": "U.S. Food and Drug Administration",
                "retrieved_at": utc_iso_now(),
                "confidence": 1.0,
                "version": "2026.1",
            }

        item = results[0]
        openfda_meta = item.get("openfda", {})

        brand_names = openfda_meta.get("brand_name", ["Unknown"])
        generic_names = openfda_meta.get("generic_name", ["Unknown"])
        manufacturers = openfda_meta.get("manufacturer_name", ["Unknown"])
        ndc_codes = openfda_meta.get("product_ndc", ["N/A"])

        indications = item.get("indications_and_usage", ["No indications listed."])[0]
        warnings = item.get("warnings", item.get("boxed_warning", ["No specific boxed warnings."]))[0]

        return {
            "name": brand_names[0] if brand_names else generic_names[0],
            "generic_name": generic_names[0] if generic_names else "N/A",
            "identifier": ndc_codes[0] if ndc_codes else "N/A",
            "manufacturer": manufacturers[0] if manufacturers else "Unknown",
            "indications": str(indications)[:500],
            "warnings": str(warnings)[:500],
            "active_ingredients": openfda_meta.get("substance_name", []),
            "source": "openFDA",
            "provider": "U.S. Food and Drug Administration",
            "source_url": f"{self.base_url}/label.json",
            "retrieved_at": utc_iso_now(),
            "confidence": 1.0,
            "version": "2026.1",
        }

    def health_check(self) -> dict[str, Any]:
        """Non-invasive probe checking openFDA service availability."""
        try:
            self.connect()
            probe_url = f"{self.base_url}/label.json"
            validate_url_against_ssrf(probe_url, allowed_domains=["api.fda.gov"])
            resp = self.session.get(probe_url, params={"limit": 1}, timeout=self.timeout)
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
