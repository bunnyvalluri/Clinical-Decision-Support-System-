class InteroperabilityError(Exception):
    """Base exception for all healthcare interoperability errors."""
    pass


class FHIRValidationError(InteroperabilityError):
    """Raised when an incoming or outgoing FHIR payload fails schema or standard validation."""
    def __init__(self, message: str, errors: list[str] | None = None, resource_type: str | None = None):
        super().__init__(message)
        self.errors = errors or []
        self.resource_type = resource_type

    def __str__(self) -> str:
        base = super().__str__()
        if self.errors:
            return f"{base} Details: {'; '.join(self.errors)}"
        return base


class FHIRMappingError(InteroperabilityError):
    """Raised when a FHIR resource cannot be translated to or from the internal domain model."""
    def __init__(self, message: str, source_field: str | None = None, target_field: str | None = None):
        super().__init__(message)
        self.source_field = source_field
        self.target_field = target_field


class ClinicalBoundsViolationError(InteroperabilityError):
    """Raised when incoming physiological observations violate clinical bounds and cannot safely enter the system."""
    def __init__(self, message: str, feature_name: str, value: float | str, safe_range: tuple[float, float] | None = None):
        super().__init__(message)
        self.feature_name = feature_name
        self.value = value
        self.safe_range = safe_range


class OverwriteProtectionError(InteroperabilityError):
    """Raised when an external update attempts to silently overwrite an authoritative internal record."""
    def __init__(self, message: str, internal_id: str, conflicting_fields: dict | None = None):
        super().__init__(message)
        self.internal_id = internal_id
        self.conflicting_fields = conflicting_fields or {}


class FHIRSecurityError(InteroperabilityError):
    """Raised when an external interoperability request fails security, SSRF, or authorization checks."""
    pass
