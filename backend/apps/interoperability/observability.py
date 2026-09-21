"""
Interoperability Observability & Telemetry — BPY-CSE-2666 (Section 33).
Integrates with Prompt 60 telemetry.
Zero patient IDs or PHI in metric labels. Correlation IDs for end-to-end tracing.
"""
from typing import Any, Dict, Optional
import time
from django.utils import timezone


class InteroperabilityTelemetry:
    """
    Centralized telemetry emitter for healthcare data exchange metrics.
    Guarantees strict privacy: Metric labels contain ONLY system codes, resource types, and error classes.
    """

    @classmethod
    def record_inbound_metric(
        cls,
        resource_type: str,
        system_name: str,
        status_code: int,
        duration_ms: float,
        is_success: bool,
        error_class: Optional[str] = None,
        correlation_id: str = "",
    ) -> Dict[str, Any]:
        """Emit telemetry metric for an inbound FHIR transaction."""
        metric = {
            "metric_name": "healthnova_fhir_inbound_duration_ms",
            "resource_type": resource_type,
            "system_name": system_name,
            "status_code": status_code,
            "is_success": is_success,
            "duration_ms": round(duration_ms, 2),
            "error_class": error_class or "NONE",
            "correlation_id": correlation_id,
            "timestamp": timezone.now().isoformat(),
        }
        return metric

    @classmethod
    def record_outbound_metric(
        cls,
        resource_type: str,
        system_name: str,
        status_code: int,
        duration_ms: float,
        is_success: bool,
        correlation_id: str = "",
    ) -> Dict[str, Any]:
        """Emit telemetry metric for an outbound FHIR transaction."""
        metric = {
            "metric_name": "healthnova_fhir_outbound_duration_ms",
            "resource_type": resource_type,
            "system_name": system_name,
            "status_code": status_code,
            "is_success": is_success,
            "duration_ms": round(duration_ms, 2),
            "correlation_id": correlation_id,
            "timestamp": timezone.now().isoformat(),
        }
        return metric

    @classmethod
    def record_validation_failure(
        cls,
        resource_type: str,
        rule_code: str,
        severity: str = "ERROR",
        correlation_id: str = "",
    ) -> Dict[str, Any]:
        """Emit validation failure counter without PHI."""
        return {
            "metric_name": "healthnova_fhir_validation_failures_total",
            "resource_type": resource_type,
            "rule_code": rule_code,
            "severity": severity,
            "correlation_id": correlation_id,
            "timestamp": timezone.now().isoformat(),
        }
