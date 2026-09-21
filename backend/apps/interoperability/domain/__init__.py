"""
Interoperability Domain Layer.
Pure clinical domain rules, enumerations, value objects, and exceptions.
"""
from .enums import (
    ConflictStatus,
    ConflictType,
    FHIRResourceStatus,
    ResolutionAction,
    SyncDirection,
    SyncStatus,
    TrustLevel,
)
from .exceptions import (
    ClinicalBoundsViolationError,
    FHIRMappingError,
    FHIRSecurityError,
    FHIRValidationError,
    OverwriteProtectionError,
)
from .value_objects import LoincCode, MatchScore, ProvenanceTag, UcumUnit

__all__ = [
    "ConflictStatus",
    "ConflictType",
    "FHIRResourceStatus",
    "ResolutionAction",
    "SyncDirection",
    "SyncStatus",
    "TrustLevel",
    "ClinicalBoundsViolationError",
    "FHIRMappingError",
    "FHIRSecurityError",
    "FHIRValidationError",
    "OverwriteProtectionError",
    "LoincCode",
    "MatchScore",
    "ProvenanceTag",
    "UcumUnit",
]
