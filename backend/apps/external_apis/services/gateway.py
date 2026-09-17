import hashlib
import json
import logging
import time
from typing import Any
from django.core.cache import cache
from django.utils import timezone

from apps.external_apis.models import (
    ExternalAPIRegistry,
    ExternalAPIHealth,
    ExternalAPIAuditLog,
    APIStatus,
    HealthStatus,
)
from apps.external_apis.providers.openfda import OpenFDAClient
from apps.external_apis.providers.nppes import NPPESClient
from apps.external_apis.providers.cms import CMSClient
from apps.external_apis.providers.nutrition import NutritionClient
from apps.external_apis.services.provenance import build_provenance_envelope

logger = logging.getLogger(__name__)

CACHE_TTL = 3600  # 1 hour
CIRCUIT_FAILURE_THRESHOLD = 3
CIRCUIT_COOLDOWN_SECONDS = 60


class ExternalAPIService:
    """
    Authoritative Gateway for outbound healthcare API communications.
    Manages provider lifecycle, circuit breaker state machine, Redis caching,
    response validation, normalization, and audit provenance.
    """

    def __init__(self) -> None:
        self.adapters = {
            "openFDA": OpenFDAClient(),
            "NPPES": NPPESClient(),
            "CMS Open Data": CMSClient(),
            "USDA FoodData Central": NutritionClient(),
        }

    def _get_cache_key(self, provider: str, endpoint: str, params: dict[str, Any] | None) -> str:
        param_str = json.dumps(params or {}, sort_keys=True)
        param_hash = hashlib.sha256(param_str.encode()).hexdigest()[:16]
        return f"ext_api:{provider.lower().replace(' ', '_')}:{endpoint}:{param_hash}"

    def _get_circuit_key(self, provider: str) -> str:
        return f"circuit_breaker:{provider.lower().replace(' ', '_')}"

    def get_circuit_state(self, provider: str) -> str:
        """Return circuit breaker state: CLOSED, OPEN, or HALF_OPEN."""
        key = self._get_circuit_key(provider)
        data = cache.get(key)
        if not data:
            return "CLOSED"
        state = data.get("state", "CLOSED")
        if state == "OPEN":
            # Check if cooldown has elapsed
            opened_at = data.get("opened_at", 0)
            if time.time() - opened_at > CIRCUIT_COOLDOWN_SECONDS:
                data["state"] = "HALF_OPEN"
                cache.set(key, data, timeout=300)
                return "HALF_OPEN"
        return state

    def record_circuit_failure(self, provider: str) -> None:
        key = self._get_circuit_key(provider)
        data = cache.get(key) or {"state": "CLOSED", "failures": 0}
        data["failures"] = data.get("failures", 0) + 1
        if data["failures"] >= CIRCUIT_FAILURE_THRESHOLD:
            data["state"] = "OPEN"
            data["opened_at"] = time.time()
            logger.warning("Circuit breaker OPENED for provider %s due to %d failures.", provider, data["failures"])
        cache.set(key, data, timeout=300)

    def record_circuit_success(self, provider: str) -> None:
        key = self._get_circuit_key(provider)
        cache.delete(key)

    def reset_circuit(self, provider: str) -> None:
        key = self._get_circuit_key(provider)
        cache.delete(key)

    def query(
        self,
        provider_name: str,
        endpoint: str = "",
        params: dict[str, Any] | None = None,
        user: Any = None,
        request_id: str = "req-direct",
    ) -> dict[str, Any]:
        """
        Execute controlled external query with circuit breaker, caching, and audit logging.
        """
        adapter = self.adapters.get(provider_name)
        if not adapter:
            raise ValueError(f"Unknown or unapproved provider: '{provider_name}'.")

        # 1. Check Circuit Breaker
        circuit_state = self.get_circuit_state(provider_name)
        if circuit_state == "OPEN":
            logger.error("External API request rejected: Circuit breaker is OPEN for %s.", provider_name)
            raise RuntimeError(f"Service for '{provider_name}' is temporarily unavailable (circuit open).")

        # 2. Check Redis Cache
        cache_key = self._get_cache_key(provider_name, endpoint, params)
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info("Serving cached external response for %s [%s]", provider_name, endpoint)
            cached_result["provenance"]["cached"] = True
            return cached_result

        # 3. Execute Request with Latency & Metrics Tracking
        start_time = time.time()
        success = False
        status_code = 200
        user_role = getattr(user, "role", "ANONYMOUS") if user else "SYSTEM"

        try:
            raw_response = adapter.request(endpoint, params=params)
            if not adapter.validate_response(raw_response):
                raise ValueError(f"Provider {provider_name} returned invalid schema payload.")

            normalized = adapter.normalize(raw_response)
            envelope = build_provenance_envelope(
                provider=provider_name,
                endpoint=endpoint,
                source_url=getattr(adapter, "base_url", ""),
                data=normalized,
            )
            # Store in cache
            cache.set(cache_key, envelope, timeout=CACHE_TTL)
            self.record_circuit_success(provider_name)
            success = True
            return envelope
        except Exception as exc:
            status_code = 500
            self.record_circuit_failure(provider_name)
            logger.warning("External API query to %s failed: %s", provider_name, exc)
            raise
        finally:
            latency_ms = (time.time() - start_time) * 1000
            try:
                reg = ExternalAPIRegistry.objects.filter(provider__iexact=provider_name).first()
                ExternalAPIAuditLog.objects.create(
                    api=reg,
                    endpoint=f"{getattr(adapter, 'base_url', '')}/{endpoint}",
                    request_id=request_id,
                    user=user if getattr(user, "is_authenticated", False) else None,
                    user_role=user_role,
                    status_code=status_code,
                    latency_ms=latency_ms,
                    success=success,
                    circuit_state=circuit_state,
                )
            except Exception as audit_exc:
                logger.debug("Failed to record external API audit log: %s", audit_exc)

    def run_health_checks(self) -> list[dict[str, Any]]:
        """Run non-invasive health probes across all approved provider adapters."""
        results = []
        for name, adapter in self.adapters.items():
            probe = adapter.health_check()
            results.append(probe)

            # Update Registry Model if present
            reg = ExternalAPIRegistry.objects.filter(provider__iexact=name).first()
            if reg:
                reg.last_validated_at = timezone.now()
                reg.health_status = HealthStatus.HEALTHY if probe.get("is_available") else HealthStatus.UNHEALTHY
                reg.save(update_fields=["last_validated_at", "health_status", "updated_at"])

                ExternalAPIHealth.objects.create(
                    api=reg,
                    latency_ms=probe.get("latency_ms", 0.0),
                    status_code=probe.get("status_code", 0),
                    is_available=probe.get("is_available", False),
                    error_message=probe.get("error", ""),
                )
        return results
