from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class LoincCode:
    code: str
    display: str
    system: str = "http://loinc.org"

    def to_fhir(self) -> Dict[str, Any]:
        return {
            "system": self.system,
            "code": self.code,
            "display": self.display,
        }


@dataclass(frozen=True)
class UcumUnit:
    code: str
    unit: str
    system: str = "http://unitsofmeasure.org"

    def to_fhir(self, value: float) -> Dict[str, Any]:
        return {
            "value": value,
            "unit": self.unit,
            "system": self.system,
            "code": self.code,
        }


@dataclass(frozen=True)
class ProvenanceTag:
    source_system: str
    external_resource_id: str
    payload_hash: str
    recorded_at: datetime
    author_reference: Optional[str] = None
    signature: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_system": self.source_system,
            "external_resource_id": self.external_resource_id,
            "payload_hash": self.payload_hash,
            "recorded_at": self.recorded_at.isoformat(),
            "author_reference": self.author_reference,
            "signature": self.signature,
        }


@dataclass(frozen=True)
class MatchScore:
    is_exact_mrn: bool
    confidence_score: float  # 0.0 to 1.0
    matched_fields: tuple[str, ...]
    matched_patient_id: Optional[str] = None
    match_tier: str = "NO_MATCH"  # EXACT, PROBABLE, POSSIBLE, NO_MATCH
