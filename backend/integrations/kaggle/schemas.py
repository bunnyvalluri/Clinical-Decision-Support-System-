"""
Pydantic schemas and dataclasses for typed Kaggle integration contracts.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DatasetLifecycleStatus(str, Enum):
    DISCOVERED = "DISCOVERED"
    METADATA_COLLECTED = "METADATA_COLLECTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VALIDATING = "VALIDATING"
    VALIDATED = "VALIDATED"
    APPROVED = "APPROVED"
    INGESTING = "INGESTING"
    INGESTED = "INGESTED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"
    DEPRECATED = "DEPRECATED"
    ARCHIVED = "ARCHIVED"


class ApprovalTier(str, Enum):
    REJECTED = "REJECTED"
    PENDING = "PENDING"
    APPROVED_FOR_RESEARCH = "APPROVED_FOR_RESEARCH"
    APPROVED_FOR_TRAINING = "APPROVED_FOR_TRAINING"
    APPROVED_FOR_PRODUCTION = "APPROVED_FOR_PRODUCTION"


class PrivacyClassification(str, Enum):
    PUBLIC = "PUBLIC"
    SENSITIVE = "SENSITIVE"
    HEALTH_DATA = "HEALTH_DATA"
    PHI = "PHI"
    SYNTHETIC = "SYNTHETIC"
    DE_IDENTIFIED = "DE_IDENTIFIED"
    UNKNOWN = "UNKNOWN"


class KaggleFileMetadata(BaseModel):
    name: str
    size_bytes: int = 0
    file_type: str = "csv"
    sha256_checksum: Optional[str] = None
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    description: Optional[str] = ""


class KaggleCandidateSummary(BaseModel):
    kaggle_owner: str
    kaggle_slug: str
    title: str
    description: str = ""
    dataset_url: str
    license_name: str = "Unknown"
    license_url: Optional[str] = None
    author: str = ""
    size_bytes: int = 0
    file_count: int = 1
    version_number: int = 1
    last_updated: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    usability_rating: float = 0.0
    download_count: int = 0
    vote_count: int = 0
    is_kernel: bool = False
    is_competition: bool = False


class KaggleMetadataSnapshot(BaseModel):
    kaggle_owner: str
    kaggle_slug: str
    title: str
    subtitle: Optional[str] = ""
    description: str
    dataset_url: str
    current_version_number: int
    license_name: str
    license_url: Optional[str] = None
    author: str
    files: List[KaggleFileMetadata] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    total_size_bytes: int = 0
    is_synthetic_claimed: bool = False
    synthetic_notes: Optional[str] = None
    citation: Optional[str] = None
    retrieved_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class DatasetVersionDiffDTO(BaseModel):
    dataset_slug: str
    prior_version: str
    new_version: str
    row_count_delta: int
    column_count_delta: int
    added_columns: List[str] = Field(default_factory=list)
    removed_columns: List[str] = Field(default_factory=list)
    schema_changed: bool = False
    distribution_shift_detected: bool = False
    diff_summary: str = ""
