"""
Unit & Contract Tests for External API Gateway & Provider Adapters:
- Circuit breaker state machine transitions (CLOSED -> OPEN -> RESET)
- Provenance envelope construction
- openFDA adapter normalization to ExternalDrugInformation
- NPPES adapter normalization to ExternalProviderInformation
- Nutrition adapter normalization to ExternalNutritionInformation
"""
import pytest
from apps.external_apis.services.gateway import ExternalAPIService
from apps.external_apis.services.provenance import build_provenance_envelope
from apps.external_apis.providers.openfda import OpenFDAClient
from apps.external_apis.providers.nppes import NPPESClient
from apps.external_apis.providers.nutrition import NutritionClient


class TestCircuitBreaker:
    """Validate circuit breaker state machine."""

    def test_initial_circuit_state_is_closed(self):
        service = ExternalAPIService()
        service.reset_circuit("TestProvider")
        assert service.get_circuit_state("TestProvider") == "CLOSED"

    def test_circuit_trips_to_open_after_three_failures(self):
        service = ExternalAPIService()
        service.reset_circuit("FailingProvider")

        service.record_circuit_failure("FailingProvider")
        assert service.get_circuit_state("FailingProvider") == "CLOSED"

        service.record_circuit_failure("FailingProvider")
        assert service.get_circuit_state("FailingProvider") == "CLOSED"

        service.record_circuit_failure("FailingProvider")
        assert service.get_circuit_state("FailingProvider") == "OPEN"

    def test_reset_circuit_returns_to_closed(self):
        service = ExternalAPIService()
        service.record_circuit_failure("TrippedProvider")
        service.record_circuit_failure("TrippedProvider")
        service.record_circuit_failure("TrippedProvider")
        assert service.get_circuit_state("TrippedProvider") == "OPEN"

        service.reset_circuit("TrippedProvider")
        assert service.get_circuit_state("TrippedProvider") == "CLOSED"


class TestProvenanceEnvelope:
    """Validate authoritative provenance labeling."""

    def test_envelope_contains_all_required_metadata(self):
        envelope = build_provenance_envelope(
            provider="openFDA",
            endpoint="label.json",
            source_url="https://api.fda.gov/drug/label.json",
            data={"name": "Lisinopril"},
            validation_status="VALIDATED",
        )

        assert "provenance" in envelope
        assert "data" in envelope

        prov = envelope["provenance"]
        assert prov["source"] == "EXTERNAL_PUBLIC_API"
        assert prov["provider"] == "openFDA"
        assert prov["endpoint"] == "label.json"
        assert prov["validation_status"] == "VALIDATED"
        assert "retrieved_at" in prov
        assert prov["data_classification"] == "PUBLIC_REFERENCE_DATA"


class TestProviderNormalization:
    """Validate canonical schema normalization across provider adapters."""

    def test_openfda_normalization(self):
        client = OpenFDAClient()
        mock_raw = {
            "results": [
                {
                    "openfda": {
                        "brand_name": ["Metformin HCl"],
                        "generic_name": ["Metformin"],
                        "manufacturer_name": ["Heritage Pharmaceuticals"],
                        "product_ndc": ["23155-018"],
                        "substance_name": ["METFORMIN HYDROCHLORIDE"],
                    },
                    "indications_and_usage": ["Indicated as an adjunct to diet and exercise to improve glycemic control."],
                    "warnings": ["Lactic acidosis is a rare, but serious complication."],
                }
            ]
        }

        normalized = client.normalize(mock_raw)
        assert normalized["name"] == "Metformin HCl"
        assert normalized["generic_name"] == "Metformin"
        assert normalized["identifier"] == "23155-018"
        assert normalized["manufacturer"] == "Heritage Pharmaceuticals"
        assert "glycemic control" in normalized["indications"]
        assert "Lactic acidosis" in normalized["warnings"]
        assert "METFORMIN HYDROCHLORIDE" in normalized["active_ingredients"]
        assert normalized["provider"] == "U.S. Food and Drug Administration"

    def test_nppes_normalization(self):
        client = NPPESClient()
        mock_raw = {
            "result_count": 1,
            "results": [
                {
                    "number": 1234567890,
                    "basic": {
                        "first_name": "Gregory",
                        "last_name": "House",
                        "credential": "MD",
                        "enumeration_date": "2005-05-23",
                        "status": "A",
                    },
                    "addresses": [
                        {
                            "address_1": "Princeton Plainsboro Hospital",
                            "city": "Princeton",
                            "state": "NJ",
                            "postal_code": "08540",
                            "telephone_number": "555-0199",
                        }
                    ],
                    "taxonomies": [{"desc": "Diagnostic Medicine"}],
                }
            ],
        }

        normalized = client.normalize(mock_raw)
        assert normalized["npi"] == "1234567890"
        assert normalized["provider_name"] == "Gregory House"
        assert normalized["specialty"] == "Diagnostic Medicine"
        assert "Princeton" in normalized["practice_address"]
        assert normalized["status"] == "ACTIVE"

    def test_nutrition_normalization(self):
        client = NutritionClient()
        mock_raw = {
            "foods": [
                {
                    "description": "Apples, raw, with skin",
                    "fdcId": 171688,
                    "servingSize": 182,
                    "servingSizeUnit": "g",
                    "foodNutrients": [
                        {"nutrientName": "Energy", "value": 95, "unitName": "kcal"},
                        {"nutrientName": "Carbohydrate, by difference", "value": 25.1, "unitName": "g"},
                    ],
                }
            ]
        }

        normalized = client.normalize(mock_raw)
        assert normalized["food_name"] == "Apples, raw, with skin"
        assert normalized["fdc_id"] == "171688"
        assert "Energy" in normalized["nutrients"]
        assert normalized["provider"] == "U.S. Department of Agriculture"
