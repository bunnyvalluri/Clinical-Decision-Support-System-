import logging
import os
from typing import Any
import requests

from apps.external_apis.interfaces.client import ExternalAPIClient
from apps.external_apis.security.ssrf import validate_url_against_ssrf, check_phi_violation
from apps.external_apis.services.provenance import utc_iso_now

logger = logging.getLogger(__name__)


class NutritionClient(ExternalAPIClient):
    """
    Adapter for USDA FoodData Central API (U.S. Department of Agriculture).
    Provides nutritional and dietary reference profiles for diabetes and hypertension triage.
    """

    provider_name: str = "USDA FoodData Central"
    base_url: str = "https://api.nal.usda.gov/fdc/v1"

    def __init__(self, timeout: int = 5) -> None:
        self.timeout = timeout
        self.session: requests.Session | None = None

    def connect(self) -> None:
        if self.session is None:
            self.session = requests.Session()

    def authenticate(self) -> dict[str, str]:
        # Uses query parameter api_key, falls back to DEMO_KEY if not configured
        return {}

    def request(
        self,
        endpoint: str = "foods/search",
        params: dict[str, Any] | None = None,
        method: str = "GET",
    ) -> dict[str, Any]:
        self.connect()
        clean_endpoint = endpoint.lstrip("/")
        full_url = f"{self.base_url}/{clean_endpoint}"

        validate_url_against_ssrf(full_url, allowed_domains=["api.nal.usda.gov"])
        query_params = dict(params or {})
        api_key = os.getenv("EXTERNAL_API_USDA_KEY", "DEMO_KEY")
        query_params["api_key"] = api_key
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
            logger.warning("USDA FoodData API request failed: %s", exc)
            raise

    def validate_response(self, response_data: dict[str, Any]) -> bool:
        return isinstance(response_data, dict) and "foods" in response_data

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Normalize USDA FoodData payload into canonical ExternalNutritionInformation."""
        foods = raw_data.get("foods", [])
        if not foods:
            return {
                "food_name": "Unknown Food",
                "fdc_id": "N/A",
                "nutrients": {},
                "serving_size": "N/A",
                "source": "USDA FoodData Central",
                "provider": "U.S. Department of Agriculture",
                "retrieved_at": utc_iso_now(),
            }

        item = foods[0]
        nutrients_list = item.get("foodNutrients", [])
        nutrients_map = {}
        for n in nutrients_list[:8]:
            name = n.get("nutrientName", "Nutrient")
            value = n.get("value", 0.0)
            unit = n.get("unitName", "g")
            nutrients_map[name] = f"{value} {unit}"

        return {
            "food_name": item.get("description", "Food Item"),
            "fdc_id": str(item.get("fdcId", "N/A")),
            "nutrients": nutrients_map,
            "serving_size": f"{item.get('servingSize', 100)} {item.get('servingSizeUnit', 'g')}",
            "source": "USDA FoodData Central",
            "provider": "U.S. Department of Agriculture",
            "retrieved_at": utc_iso_now(),
        }

    def health_check(self) -> dict[str, Any]:
        try:
            self.connect()
            probe_url = f"{self.base_url}/foods/search"
            validate_url_against_ssrf(probe_url, allowed_domains=["api.nal.usda.gov"])
            api_key = os.getenv("EXTERNAL_API_USDA_KEY", "DEMO_KEY")
            resp = self.session.get(
                probe_url,
                params={"query": "apple", "pageSize": 1, "api_key": api_key},
                timeout=self.timeout,
            )
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
