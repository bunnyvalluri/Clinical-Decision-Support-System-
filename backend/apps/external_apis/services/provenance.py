import datetime
import uuid
from typing import Any


def utc_iso_now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def build_provenance_envelope(
    provider: str,
    endpoint: str,
    source_url: str,
    data: Any,
    source_version: str = "v1",
    validation_status: str = "VALIDATED",
) -> dict[str, Any]:
    """
    Wraps normalized external API payload with authoritative provenance metadata.
    Prevents external data from ever being confused with local authoritative records.
    """
    return {
        "provenance": {
            "source": "EXTERNAL_PUBLIC_API",
            "provider": provider,
            "endpoint": endpoint,
            "source_url": source_url,
            "retrieved_at": utc_iso_now(),
            "request_id": f"req-ext-{uuid.uuid4().hex[:10]}",
            "source_version": source_version,
            "validation_status": validation_status,
            "data_classification": "PUBLIC_REFERENCE_DATA",
        },
        "data": data,
    }
