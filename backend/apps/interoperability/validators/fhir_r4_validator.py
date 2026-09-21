"""
HL7 FHIR Release 4 (R4 - v4.0.1) Schema and Structural Validator.
Ensures incoming and outgoing payloads strictly conform to FHIR R4 definitions.
"""
from datetime import date, datetime
import re
from typing import Any, Dict, List

from apps.interoperability.domain.exceptions import FHIRValidationError


class FHIRR4Validator:
    """
    Validates FHIR R4 resource structures, required fields, data types, and coding systems.
    """

    SUPPORTED_RESOURCE_TYPES = {
        "Patient",
        "Practitioner",
        "Organization",
        "Encounter",
        "Observation",
        "Condition",
        "DiagnosticReport",
        "ServiceRequest",
        "RiskAssessment",
        "Bundle",
        "Provenance",
    }

    VALID_GENDERS = {"male", "female", "other", "unknown"}
    VALID_OBSERVATION_STATUSES = {
        "registered", "preliminary", "final", "amended",
        "corrected", "cancelled", "entered-in-error", "unknown",
    }
    VALID_ENCOUNTER_STATUSES = {
        "planned", "arrived", "triaged", "in-progress",
        "onleave", "finished", "cancelled", "entered-in-error", "unknown",
    }
    VALID_RISK_ASSESSMENT_STATUSES = {
        "registered", "preliminary", "final", "amended",
        "corrected", "cancelled", "entered-in-error", "unknown",
    }

    @classmethod
    def validate_resource(cls, payload: Dict[str, Any]) -> None:
        """
        Main entrypoint: validates any FHIR R4 resource payload.
        Raises FHIRValidationError if invalid.
        """
        if not isinstance(payload, dict):
            raise FHIRValidationError("FHIR resource payload must be a JSON object (dict).")

        resource_type = payload.get("resourceType")
        if not resource_type:
            raise FHIRValidationError("Missing required 'resourceType' in FHIR payload.")

        if resource_type not in cls.SUPPORTED_RESOURCE_TYPES:
            raise FHIRValidationError(
                f"Resource type '{resource_type}' is not supported by HealthNova AI interoperability layer.",
                resource_type=resource_type,
            )

        # Resource-specific dispatch
        validator_fn = getattr(cls, f"_validate_{resource_type.lower()}", None)
        if validator_fn:
            validator_fn(payload)

    @classmethod
    def _validate_patient(cls, payload: Dict[str, Any]) -> None:
        errors: List[str] = []

        # Validate gender if present
        gender = payload.get("gender")
        if gender and gender.lower() not in cls.VALID_GENDERS:
            errors.append(f"Invalid FHIR Patient.gender '{gender}'. Must be one of: {', '.join(cls.VALID_GENDERS)}")

        # Validate birthDate if present
        birth_date = payload.get("birthDate")
        if birth_date and not cls._is_valid_date(birth_date):
            errors.append(f"Invalid FHIR Patient.birthDate format '{birth_date}'. Must be YYYY, YYYY-MM, or YYYY-MM-DD.")

        # Validate identifiers if present
        identifiers = payload.get("identifier")
        if identifiers is not None and not isinstance(identifiers, list):
            errors.append("FHIR Patient.identifier must be an array of Identifier objects.")

        # Validate name if present
        names = payload.get("name")
        if names is not None and not isinstance(names, list):
            errors.append("FHIR Patient.name must be an array of HumanName objects.")

        if errors:
            raise FHIRValidationError(
                f"FHIR Patient validation failed with {len(errors)} error(s).",
                errors=errors,
                resource_type="Patient",
            )

    @classmethod
    def _validate_observation(cls, payload: Dict[str, Any]) -> None:
        errors: List[str] = []

        # Required: status
        status = payload.get("status")
        if not status:
            errors.append("Missing required field 'status' in Observation.")
        elif status.lower() not in cls.VALID_OBSERVATION_STATUSES:
            errors.append(f"Invalid Observation.status '{status}'.")

        # Required: code
        code = payload.get("code")
        if not code or not isinstance(code, dict):
            errors.append("Missing or invalid required field 'code' (CodeableConcept) in Observation.")
        else:
            codings = code.get("coding")
            if not codings or not isinstance(codings, list):
                errors.append("Observation.code must contain at least one coding element in 'coding' array.")

        # Required: subject
        subject = payload.get("subject")
        if not subject or not isinstance(subject, dict) or not subject.get("reference"):
            errors.append("Missing required field 'subject' with valid reference in Observation.")

        # Must have a value or components
        has_value = any(k.startswith("value") for k in payload)
        has_component = "component" in payload and isinstance(payload["component"], list) and len(payload["component"]) > 0
        has_data_absent_reason = "dataAbsentReason" in payload

        if not (has_value or has_component or has_data_absent_reason):
            errors.append("Observation must have either a value[x], component[x], or dataAbsentReason.")

        # Validate effectiveDateTime if present
        effective_dt = payload.get("effectiveDateTime")
        if effective_dt and not cls._is_valid_datetime(effective_dt):
            errors.append(f"Invalid Observation.effectiveDateTime format '{effective_dt}'.")

        if errors:
            raise FHIRValidationError(
                f"FHIR Observation validation failed with {len(errors)} error(s).",
                errors=errors,
                resource_type="Observation",
            )

    @classmethod
    def _validate_encounter(cls, payload: Dict[str, Any]) -> None:
        errors: List[str] = []

        status = payload.get("status")
        if not status:
            errors.append("Missing required field 'status' in Encounter.")
        elif status.lower() not in cls.VALID_ENCOUNTER_STATUSES:
            errors.append(f"Invalid Encounter.status '{status}'.")

        subject = payload.get("subject")
        if not subject or not isinstance(subject, dict) or not subject.get("reference"):
            errors.append("Missing required field 'subject' (reference to Patient) in Encounter.")

        if errors:
            raise FHIRValidationError(
                f"FHIR Encounter validation failed with {len(errors)} error(s).",
                errors=errors,
                resource_type="Encounter",
            )

    @classmethod
    def _validate_riskassessment(cls, payload: Dict[str, Any]) -> None:
        errors: List[str] = []

        status = payload.get("status")
        if not status:
            errors.append("Missing required field 'status' in RiskAssessment.")
        elif status.lower() not in cls.VALID_RISK_ASSESSMENT_STATUSES:
            errors.append(f"Invalid RiskAssessment.status '{status}'.")

        subject = payload.get("subject")
        if not subject or not isinstance(subject, dict) or not subject.get("reference"):
            errors.append("Missing required field 'subject' (reference to Patient) in RiskAssessment.")

        prediction = payload.get("prediction")
        if prediction is not None and not isinstance(prediction, list):
            errors.append("RiskAssessment.prediction must be a list of prediction objects.")

        if errors:
            raise FHIRValidationError(
                f"FHIR RiskAssessment validation failed with {len(errors)} error(s).",
                errors=errors,
                resource_type="RiskAssessment",
            )

    @classmethod
    def _validate_bundle(cls, payload: Dict[str, Any]) -> None:
        errors: List[str] = []

        bundle_type = payload.get("type")
        if not bundle_type:
            errors.append("Missing required field 'type' in Bundle.")

        entry = payload.get("entry")
        if entry is not None and not isinstance(entry, list):
            errors.append("Bundle.entry must be a list of BundleEntry objects.")
        elif entry:
            for idx, item in enumerate(entry):
                if not isinstance(item, dict):
                    errors.append(f"Bundle entry at index {idx} must be a dictionary.")
                elif "resource" in item:
                    try:
                        cls.validate_resource(item["resource"])
                    except FHIRValidationError as ve:
                        errors.append(f"Entry {idx} ({item.get('resource', {}).get('resourceType')}): {str(ve)}")

        if errors:
            raise FHIRValidationError(
                f"FHIR Bundle validation failed with {len(errors)} error(s).",
                errors=errors,
                resource_type="Bundle",
            )

    @staticmethod
    def _is_valid_date(date_str: str) -> bool:
        if not isinstance(date_str, str):
            return False
        # Matches YYYY, YYYY-MM, or YYYY-MM-DD
        if re.match(r"^\d{4}(-\d{2}(-\d{2})?)?$", date_str):
            try:
                parts = date_str.split("-")
                if len(parts) == 3:
                    date.fromisoformat(date_str)
                elif len(parts) == 2:
                    int(parts[0])
                    m = int(parts[1])
                    if not (1 <= m <= 12):
                        return False
                return True
            except ValueError:
                return False
        return False

    @staticmethod
    def _is_valid_datetime(dt_str: str) -> bool:
        if not isinstance(dt_str, str):
            return False
        try:
            # Replaces Z with +00:00 for ISO format compatibility
            clean_dt = dt_str.replace("Z", "+00:00")
            datetime.fromisoformat(clean_dt)
            return True
        except ValueError:
            return False
