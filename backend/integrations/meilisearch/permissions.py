"""
Search Policy Service & Role-Based Authorization.
Authoritative gatekeeper for multi-role search access control.
Never trusts client-supplied tenant, user, or index parameters.
"""
import re
from typing import Any, Dict, List, Optional, Set
from .settings import (
    ALL_INDEXES,
    INDEX_PATIENTS,
    INDEX_CLINICAL_RECORDS,
    INDEX_PREDICTIONS,
    INDEX_TRIAGE_RECORDS,
    INDEX_CLINICAL_TASKS,
    INDEX_ESCALATIONS,
    INDEX_MODELS,
    INDEX_DATA_QUALITY,
    INDEX_AI_EVALUATIONS,
    INDEX_WHITEBOARDS,
    INDEX_SYSTEM_EVENTS,
    INDEX_KNOWLEDGE_SOURCES,
)
from .exceptions import FilterInjectionException, SearchUnauthorizedException

# Role definition constants
ROLE_DOCTOR = "DOCTOR"
ROLE_NURSE = "NURSE"
ROLE_INFORMATICIST = "MEDICAL_INFORMATICIST"
ROLE_ANALYST = "ANALYST"
ROLE_IT_ADMIN = "IT_ADMIN"
ROLE_ADMIN = "ADMIN"
ROLE_PATIENT = "PATIENT"
ROLE_USER = "USER"

ROLE_ALLOWED_INDEXES: Dict[str, Set[str]] = {
    ROLE_DOCTOR: {
        INDEX_PATIENTS,
        INDEX_CLINICAL_RECORDS,
        INDEX_PREDICTIONS,
        INDEX_ESCALATIONS,
        INDEX_CLINICAL_TASKS,
        INDEX_MODELS,
        INDEX_WHITEBOARDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
    ROLE_NURSE: {
        INDEX_PATIENTS,
        INDEX_TRIAGE_RECORDS,
        INDEX_CLINICAL_TASKS,
        INDEX_ESCALATIONS,
        INDEX_PREDICTIONS,
        INDEX_WHITEBOARDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
    ROLE_INFORMATICIST: {
        INDEX_MODELS,
        INDEX_DATA_QUALITY,
        INDEX_AI_EVALUATIONS,
        INDEX_PREDICTIONS,
        INDEX_WHITEBOARDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
    ROLE_ANALYST: {
        INDEX_MODELS,
        INDEX_DATA_QUALITY,
        INDEX_AI_EVALUATIONS,
        INDEX_PREDICTIONS,
        INDEX_WHITEBOARDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
    ROLE_IT_ADMIN: {
        INDEX_SYSTEM_EVENTS,
        INDEX_DATA_QUALITY,
        INDEX_MODELS,
        INDEX_WHITEBOARDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
    ROLE_ADMIN: {
        INDEX_SYSTEM_EVENTS,
        INDEX_DATA_QUALITY,
        INDEX_MODELS,
        INDEX_WHITEBOARDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
    ROLE_PATIENT: {
        INDEX_PATIENTS,
        INDEX_PREDICTIONS,
        INDEX_CLINICAL_RECORDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
    ROLE_USER: {
        INDEX_PATIENTS,
        INDEX_PREDICTIONS,
        INDEX_CLINICAL_RECORDS,
        INDEX_KNOWLEDGE_SOURCES,
    },
}

# Role field exclusion policies (fields stripped before returning to client)
ROLE_STRIPPED_FIELDS: Dict[str, Set[str]] = {
    ROLE_PATIENT: {"password", "secret", "notes", "primary_physician_id", "care_team_id"},
    ROLE_USER: {"password", "secret", "notes", "primary_physician_id", "care_team_id"},
    ROLE_INFORMATICIST: {"phone_number", "email", "address", "emergency_contact_phone"},
    ROLE_IT_ADMIN: {"systolic_bp", "diastolic_bp", "heart_rate", "body_temperature", "chief_complaint"},
}


class SearchPolicyService:
    """Evaluates search authorizations and generates safe filter expressions."""

    @classmethod
    def normalize_role(cls, user: Any) -> str:
        """Extract and normalize user role string."""
        if not user or not user.is_authenticated:
            return "ANONYMOUS"
        role = getattr(user, "role", None)
        if hasattr(role, "value"):
            role = role.value
        role_str = str(role or "PATIENT").upper()
        if role_str == "ADMIN":
            return ROLE_IT_ADMIN
        if role_str == "ANALYST":
            return ROLE_INFORMATICIST
        if role_str == "USER":
            return ROLE_PATIENT
        return role_str

    @classmethod
    def can_search_index(cls, user: Any, index_name: str) -> bool:
        """Check if user role is allowed to search given index."""
        role = cls.normalize_role(user)
        allowed = ROLE_ALLOWED_INDEXES.get(role, set())
        return index_name in allowed

    @classmethod
    def get_allowed_indexes(cls, user: Any) -> List[str]:
        """Return all indexes the user is authorized to search."""
        role = cls.normalize_role(user)
        return list(ROLE_ALLOWED_INDEXES.get(role, set()))

    @classmethod
    def get_mandatory_filters(cls, user: Any, index_name: str) -> List[str]:
        """
        Generate mandatory server-side filter clauses.
        Prevents IDOR and tenant/patient crossing.
        """
        role = cls.normalize_role(user)
        filters = []

        # PATIENT isolation: strictly restricted to records where user_id matches
        if role in (ROLE_PATIENT, ROLE_USER):
            user_id = getattr(user, "id", None)
            if index_name in (INDEX_PATIENTS, INDEX_PREDICTIONS, INDEX_CLINICAL_RECORDS):
                if user_id:
                    filters.append(f'user_id = {user_id}')
                else:
                    filters.append('user_id = -1')

        # DOCTOR isolation: active patients and records
        elif role == ROLE_DOCTOR:
            if index_name == INDEX_PATIENTS:
                filters.append('is_active = true')

        # NURSE isolation: active triage and records
        elif role == ROLE_NURSE:
            if index_name == INDEX_PATIENTS:
                filters.append('is_active = true')

        return filters

    @classmethod
    def validate_and_sanitize_filter(cls, user: Any, index_name: str, filters_dict: Optional[Dict[str, Any]]) -> List[str]:
        """
        Validate and escape user-supplied filters.
        Guarantees protection against filter injection.
        """
        if not filters_dict:
            return []

        clean_clauses = []
        # Dangerous patterns checking for injection
        injection_pattern = re.compile(r'["\';\\()]|(AND\s)|(OR\s)|(NOT\s)', re.IGNORECASE)

        for key, val in filters_dict.items():
            # Allowlist key characters (alphanumeric and underscore only)
            if not re.match(r'^[a-zA-Z0-9_]+$', str(key)):
                raise FilterInjectionException(f"Invalid filter attribute name: {key}")

            # If user is patient, reject client attempts to filter by user_id or patient_id
            role = cls.normalize_role(user)
            if role in (ROLE_PATIENT, ROLE_USER) and key in ("user_id", "patient_id"):
                continue

            if isinstance(val, (int, float)):
                clean_clauses.append(f"{key} = {val}")
            elif isinstance(val, bool):
                clean_clauses.append(f"{key} = {'true' if val else 'false'}")
            elif isinstance(val, str):
                if injection_pattern.search(val):
                    raise FilterInjectionException(f"Potential filter injection detected in parameter '{key}'")
                safe_val = val.replace('"', '\\"')
                clean_clauses.append(f'{key} = "{safe_val}"')
            elif isinstance(val, list):
                # Array of primitives (e.g. IN filter)
                safe_items = []
                for item in val:
                    if isinstance(item, (int, float)):
                        safe_items.append(str(item))
                    elif isinstance(item, str):
                        if injection_pattern.search(item):
                            raise FilterInjectionException(f"Potential filter injection in list '{key}'")
                        escaped_item = item.replace('"', '\\"')
                        safe_items.append(f'"{escaped_item}"')
                if safe_items:
                    clean_clauses.append(f"{key} IN [{', '.join(safe_items)}]")

        return clean_clauses

    @classmethod
    def filter_document_fields(cls, user: Any, index_name: str, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Strip sensitive or unauthorized fields before presentation."""
        role = cls.normalize_role(user)
        stripped_keys = ROLE_STRIPPED_FIELDS.get(role, set())
        return {k: v for k, v in doc.items() if k not in stripped_keys}
