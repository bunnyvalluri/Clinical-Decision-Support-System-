"""
Index Manager for Meilisearch.
Handles programmatic setup, settings migration, ranking rules,
attribute categorization, and typo tolerance safety configurations.
"""
import logging
from typing import Any, Dict, List, Optional
from .client import get_meilisearch_client
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

logger = logging.getLogger(__name__)

INDEX_CONFIGS: Dict[str, Dict[str, Any]] = {
    INDEX_PATIENTS: {
        "primary_key": "document_id",
        "searchable_attributes": [
            "display_name",
            "first_name",
            "last_name",
            "mrn",
            "department",
            "care_team_id",
        ],
        "filterable_attributes": [
            "patient_id",
            "mrn",
            "is_active",
            "care_team_id",
            "primary_physician_id",
            "user_id",
            "blood_group",
            "gender",
            "organization_id",
        ],
        "sortable_attributes": ["last_name", "updated_at", "created_at"],
        "displayed_attributes": [
            "document_id",
            "patient_id",
            "mrn",
            "display_name",
            "first_name",
            "last_name",
            "gender",
            "blood_group",
            "department",
            "primary_physician_id",
            "care_team_id",
            "is_active",
            "updated_at",
            "schema_version",
        ],
        "typo_tolerance": {
            "enabled": True,
            "minWordSizeForTypos": {"oneTypo": 5, "twoTypos": 9},
            "disableOnNumbers": True,
            "disableOnAttributes": ["mrn", "patient_id", "document_id"],
        },
    },
    INDEX_CLINICAL_RECORDS: {
        "primary_key": "document_id",
        "searchable_attributes": ["encounter_type", "recorded_by_name", "summary"],
        "filterable_attributes": [
            "patient_id",
            "encounter_type",
            "recorded_by_id",
            "organization_id",
            "recorded_at",
        ],
        "sortable_attributes": ["recorded_at", "updated_at"],
        "displayed_attributes": [
            "document_id",
            "record_id",
            "patient_id",
            "patient_mrn",
            "encounter_type",
            "systolic_bp",
            "diastolic_bp",
            "heart_rate",
            "respiratory_rate",
            "body_temperature",
            "oxygen_saturation",
            "recorded_by_name",
            "recorded_at",
            "schema_version",
        ],
        "typo_tolerance": {
            "enabled": True,
            "disableOnNumbers": True,
            "disableOnAttributes": ["patient_id", "record_id", "document_id"],
        },
    },
    INDEX_PREDICTIONS: {
        "primary_key": "document_id",
        "searchable_attributes": [
            "patient_mrn",
            "model_name",
            "model_version_str",
            "prediction_result",
            "clinical_rationale",
        ],
        "filterable_attributes": [
            "patient_id",
            "prediction_result",
            "model_name",
            "model_version_str",
            "primary_physician_id",
            "organization_id",
            "created_at",
        ],
        "sortable_attributes": ["created_at", "probability"],
        "displayed_attributes": [
            "document_id",
            "prediction_id",
            "patient_id",
            "patient_mrn",
            "model_name",
            "model_version_str",
            "prediction_result",
            "probability",
            "confidence_lower",
            "confidence_upper",
            "created_at",
            "schema_version",
        ],
        "typo_tolerance": {
            "enabled": True,
            "disableOnNumbers": True,
            "disableOnAttributes": ["patient_mrn", "patient_id", "prediction_id", "model_version_str"],
        },
    },
    INDEX_TRIAGE_RECORDS: {
        "primary_key": "document_id",
        "searchable_attributes": ["chief_complaint", "bed_assignment", "nurse_name", "patient_mrn"],
        "filterable_attributes": ["patient_id", "state", "acuity_level", "nurse_id", "arrival_time"],
        "sortable_attributes": ["acuity_level", "arrival_time"],
        "displayed_attributes": [
            "document_id",
            "triage_id",
            "patient_id",
            "patient_mrn",
            "state",
            "acuity_level",
            "chief_complaint",
            "bed_assignment",
            "arrival_time",
            "schema_version",
        ],
        "typo_tolerance": {
            "enabled": True,
            "disableOnNumbers": True,
            "disableOnAttributes": ["patient_id", "triage_id", "patient_mrn"],
        },
    },
    INDEX_CLINICAL_TASKS: {
        "primary_key": "document_id",
        "searchable_attributes": ["title", "task_type", "priority", "notes"],
        "filterable_attributes": ["patient_id", "assigned_to_id", "status", "priority", "task_type", "due_at"],
        "sortable_attributes": ["due_at", "created_at"],
        "displayed_attributes": [
            "document_id",
            "task_id",
            "patient_id",
            "patient_mrn",
            "title",
            "task_type",
            "priority",
            "status",
            "due_at",
            "schema_version",
        ],
        "typo_tolerance": {
            "enabled": True,
            "disableOnNumbers": True,
            "disableOnAttributes": ["task_id", "patient_id"],
        },
    },
    INDEX_ESCALATIONS: {
        "primary_key": "document_id",
        "searchable_attributes": ["reason", "priority", "status", "assigned_doctor_name", "patient_mrn"],
        "filterable_attributes": ["patient_id", "priority", "status", "assigned_doctor_id", "escalated_by_id"],
        "sortable_attributes": ["created_at"],
        "displayed_attributes": [
            "document_id",
            "escalation_id",
            "patient_id",
            "patient_mrn",
            "reason",
            "priority",
            "status",
            "created_at",
            "schema_version",
        ],
        "typo_tolerance": {
            "enabled": True,
            "disableOnNumbers": True,
            "disableOnAttributes": ["escalation_id", "patient_id", "patient_mrn"],
        },
    },
    INDEX_MODELS: {
        "primary_key": "document_id",
        "searchable_attributes": ["name", "algorithm", "version", "description", "created_by_name"],
        "filterable_attributes": ["status", "algorithm", "version", "is_active", "is_default"],
        "sortable_attributes": ["created_at", "roc_auc", "f1_score"],
        "displayed_attributes": [
            "document_id",
            "model_id",
            "name",
            "algorithm",
            "version",
            "status",
            "roc_auc",
            "f1_score",
            "is_active",
            "is_default",
            "created_at",
            "schema_version",
        ],
        "typo_tolerance": {
            "enabled": True,
            "disableOnNumbers": True,
            "disableOnAttributes": ["model_id", "version"],
        },
    },
    INDEX_DATA_QUALITY: {
        "primary_key": "document_id",
        "searchable_attributes": ["dataset", "issue_type", "column_name", "description"],
        "filterable_attributes": ["severity", "status", "dataset", "issue_type"],
        "sortable_attributes": ["created_at", "severity"],
        "displayed_attributes": [
            "document_id",
            "issue_id",
            "dataset",
            "issue_type",
            "severity",
            "status",
            "description",
            "created_at",
            "schema_version",
        ],
        "typo_tolerance": {"enabled": True, "disableOnNumbers": True},
    },
    INDEX_AI_EVALUATIONS: {
        "primary_key": "document_id",
        "searchable_attributes": ["operation_type", "safety_status", "clinician_name"],
        "filterable_attributes": ["safety_status", "requires_human_review", "operation_type", "created_at"],
        "sortable_attributes": ["created_at"],
        "displayed_attributes": [
            "document_id",
            "evaluation_id",
            "correlation_id",
            "operation_type",
            "safety_status",
            "requires_human_review",
            "created_at",
            "schema_version",
        ],
        "typo_tolerance": {"enabled": True, "disableOnNumbers": True},
    },
    INDEX_WHITEBOARDS: {
        "primary_key": "document_id",
        "searchable_attributes": ["title", "description", "type", "owner_name"],
        "filterable_attributes": ["type", "status", "classification", "owner_id", "updated_at"],
        "sortable_attributes": ["updated_at", "title"],
        "displayed_attributes": [
            "document_id",
            "whiteboard_id",
            "title",
            "description",
            "type",
            "status",
            "classification",
            "owner_name",
            "updated_at",
            "schema_version",
        ],
        "typo_tolerance": {"enabled": True, "disableOnNumbers": True},
    },
    INDEX_SYSTEM_EVENTS: {
        "primary_key": "document_id",
        "searchable_attributes": ["action", "resource_type", "user_username", "ip_address"],
        "filterable_attributes": ["action", "resource_type", "status", "timestamp"],
        "sortable_attributes": ["timestamp"],
        "displayed_attributes": [
            "document_id",
            "event_id",
            "action",
            "resource_type",
            "status",
            "timestamp",
            "schema_version",
        ],
        "typo_tolerance": {"enabled": False},
    },
    INDEX_KNOWLEDGE_SOURCES: {
        "primary_key": "document_id",
        "searchable_attributes": ["title", "summary", "specialty", "content", "tags"],
        "filterable_attributes": ["specialty", "source_type", "approval_status", "tags"],
        "sortable_attributes": ["title", "updated_at"],
        "displayed_attributes": [
            "document_id",
            "knowledge_id",
            "title",
            "summary",
            "specialty",
            "source_type",
            "approval_status",
            "tags",
            "updated_at",
            "schema_version",
        ],
        "typo_tolerance": {"enabled": True, "disableOnNumbers": True},
    },
}


class IndexManager:
    """Manages Meilisearch indexes, settings configuration, and migrations."""

    def __init__(self, client: Optional[Any] = None):
        self.client = client or get_meilisearch_client()

    def setup_all_indexes(self) -> Dict[str, Any]:
        """Ensure all required indexes exist with their respective settings."""
        results = {}
        if not self.client.is_available():
            logger.warning("Meilisearch unavailable; skipping index setup.")
            return {"status": "skipped", "reason": "service_unavailable"}

        for index_uid, config in INDEX_CONFIGS.items():
            try:
                results[index_uid] = self.setup_index(index_uid, config)
            except Exception as exc:
                logger.error("Failed setting up index '%s': %s", index_uid, exc)
                results[index_uid] = {"status": "error", "error": str(exc)}

        return {"status": "success", "indexes": results}

    def setup_index(self, index_uid: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a single index with defined settings."""
        raw = self.client.raw_client

        # 1. Create index if not exists
        try:
            raw.get_index(index_uid)
        except Exception:
            raw.create_index(index_uid, {"primaryKey": config.get("primary_key", "document_id")})

        idx = raw.index(index_uid)

        # 2. Update Searchable Attributes
        if "searchable_attributes" in config:
            idx.update_searchable_attributes(config["searchable_attributes"])

        # 3. Update Filterable Attributes
        if "filterable_attributes" in config:
            idx.update_filterable_attributes(config["filterable_attributes"])

        # 4. Update Sortable Attributes
        if "sortable_attributes" in config:
            idx.update_sortable_attributes(config["sortable_attributes"])

        # 5. Update Displayed Attributes
        if "displayed_attributes" in config:
            idx.update_displayed_attributes(config["displayed_attributes"])

        # 6. Update Typo Tolerance
        if "typo_tolerance" in config:
            idx.update_typo_tolerance(config["typo_tolerance"])

        return {"status": "configured", "index": index_uid}

    def delete_index(self, index_uid: str) -> bool:
        """Safely delete an index (admin operation only)."""
        try:
            self.client.raw_client.delete_index(index_uid)
            return True
        except Exception as exc:
            logger.warning("Failed to delete index %s: %s", index_uid, exc)
            return False


_index_manager_instance: Optional[IndexManager] = None


def get_index_manager() -> IndexManager:
    global _index_manager_instance
    if _index_manager_instance is None:
        _index_manager_instance = IndexManager()
    return _index_manager_instance
