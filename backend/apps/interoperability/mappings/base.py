"""
Base FHIR R4 Mapper Abstract Class.
Defines standard bi-directional contract between internal Neon domain models and FHIR R4 resources.
"""
from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Any, Dict, List, Optional


class BaseFHIRMapper(ABC):
    """
    Abstract base mapper providing common FHIR serialization and parsing helpers.
    """

    @classmethod
    @abstractmethod
    def to_fhir(cls, model_obj: Any) -> Dict[str, Any]:
        """Convert an internal Django domain model instance to a FHIR R4 JSON resource."""
        pass

    @classmethod
    @abstractmethod
    def to_internal(cls, fhir_resource: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a FHIR R4 JSON resource into normalized dictionary ready for internal domain models."""
        pass

    @staticmethod
    def extract_identifier(identifiers: List[Dict[str, Any]], system: Optional[str] = None, use: Optional[str] = None) -> Optional[str]:
        """Extract identifier value matching given system or use."""
        if not identifiers or not isinstance(identifiers, list):
            return None
        for ident in identifiers:
            if not isinstance(ident, dict):
                continue
            if system and ident.get("system") == system:
                return ident.get("value")
            if use and ident.get("use") == use:
                return ident.get("value")
        # Return first available value if specific match not found
        for ident in identifiers:
            if isinstance(ident, dict) and ident.get("value"):
                return ident.get("value")
        return None

    @staticmethod
    def extract_reference_id(reference_dict: Optional[Dict[str, Any]]) -> Optional[str]:
        """Extract resource ID from a FHIR Reference (e.g. 'Patient/123-abc' -> '123-abc')."""
        if not reference_dict or not isinstance(reference_dict, dict):
            return None
        ref_str = reference_dict.get("reference", "")
        if not ref_str:
            return None
        parts = ref_str.split("/")
        return parts[-1] if parts else None

    @staticmethod
    def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
        """Safely parse ISO datetime string."""
        if not dt_str:
            return None
        try:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def parse_date(date_str: Optional[str]) -> Optional[date]:
        """Safely parse ISO date string."""
        if not date_str:
            return None
        try:
            return date.fromisoformat(date_str[:10])
        except (ValueError, TypeError):
            return None
