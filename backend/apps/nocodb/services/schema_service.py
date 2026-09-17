"""
Schema initialization and management service for governed NocoDB datasets.
"""
from apps.nocodb.models import (
    NocoDBDataset,
    NocoDBSchemaColumn,
    DatasetCategory,
    ColumnDataType,
)


STANDARD_DATASETS = [
    {
        "slug": "ml_predictions_monitoring",
        "title": "ML Predictions Monitoring",
        "description": "De-identified ML risk scoring records, model versions, and clinician reviews.",
        "category": DatasetCategory.ML_OPS,
        "allowed_roles": ["informaticist", "admin", "doctor"],
        "source_model": "predictions.Prediction",
        "columns": [
            {"name": "id", "display_name": "Record ID", "column_type": ColumnDataType.NUMBER, "is_primary": True, "order": 1},
            {"name": "anon_patient_token", "display_name": "Patient Token", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 2},
            {"name": "risk_score", "display_name": "Risk Probability", "column_type": ColumnDataType.NUMBER, "order": 3},
            {"name": "risk_tier", "display_name": "Risk Tier", "column_type": ColumnDataType.SELECT, "options": ["Low", "Moderate", "High", "Critical"], "order": 4},
            {"name": "model_version", "display_name": "Model Version", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 5},
            {"name": "evaluated_at", "display_name": "Evaluated At", "column_type": ColumnDataType.DATETIME, "order": 6},
            {"name": "clinician_reviewed", "display_name": "Clinician Reviewed", "column_type": ColumnDataType.CHECKBOX, "is_read_only": False, "order": 7},
            {"name": "review_status", "display_name": "Review Status", "column_type": ColumnDataType.SELECT, "options": ["PENDING", "AGREED", "OVERRIDDEN"], "is_read_only": False, "order": 8},
        ],
    },
    {
        "slug": "model_eval_registry",
        "title": "Model Evaluation Registry",
        "description": "Validation benchmark performance, ROC-AUC, F1 scores, and calibration metrics.",
        "category": DatasetCategory.ML_OPS,
        "allowed_roles": ["informaticist", "admin", "doctor"],
        "source_model": "model_registry.MLModel",
        "columns": [
            {"name": "id", "display_name": "Model ID", "column_type": ColumnDataType.NUMBER, "is_primary": True, "order": 1},
            {"name": "model_name", "display_name": "Model Name", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 2},
            {"name": "version", "display_name": "Version", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 3},
            {"name": "roc_auc", "display_name": "ROC-AUC", "column_type": ColumnDataType.NUMBER, "order": 4},
            {"name": "f1_score", "display_name": "F1 Score", "column_type": ColumnDataType.NUMBER, "order": 5},
            {"name": "brier_score", "display_name": "Brier Score", "column_type": ColumnDataType.NUMBER, "order": 6},
            {"name": "cohort_size", "display_name": "Cohort Size", "column_type": ColumnDataType.NUMBER, "order": 7},
            {"name": "status", "display_name": "Status", "column_type": ColumnDataType.SELECT, "options": ["ACTIVE", "CHALLENGER", "RETIRED"], "order": 8},
            {"name": "validated_at", "display_name": "Validated At", "column_type": ColumnDataType.DATETIME, "order": 9},
        ],
    },
    {
        "slug": "feature_drift_ledger",
        "title": "Feature Drift Ledger",
        "description": "Population Stability Index (PSI) and statistical drift tracking across clinical features.",
        "category": DatasetCategory.ML_OPS,
        "allowed_roles": ["informaticist", "admin"],
        "source_model": "ml_engine.FeatureDrift",
        "columns": [
            {"name": "id", "display_name": "ID", "column_type": ColumnDataType.NUMBER, "is_primary": True, "order": 1},
            {"name": "feature_name", "display_name": "Feature Name", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 2},
            {"name": "psi_score", "display_name": "PSI Score", "column_type": ColumnDataType.NUMBER, "order": 3},
            {"name": "drift_status", "display_name": "Drift Status", "column_type": ColumnDataType.SELECT, "options": ["Stable", "Moderate", "Critical"], "order": 4},
            {"name": "ks_p_value", "display_name": "KS p-value", "column_type": ColumnDataType.NUMBER, "order": 5},
            {"name": "baseline_mean", "display_name": "Baseline Mean", "column_type": ColumnDataType.NUMBER, "order": 6},
            {"name": "current_mean", "display_name": "Current Mean", "column_type": ColumnDataType.NUMBER, "order": 7},
            {"name": "last_calculated", "display_name": "Last Calculated", "column_type": ColumnDataType.DATETIME, "order": 8},
        ],
    },
    {
        "slug": "data_quality_queue",
        "title": "Data Quality Issues Queue",
        "description": "Ingestion anomalies, missingness flags, and schema constraint checks.",
        "category": DatasetCategory.DATA_QUALITY,
        "allowed_roles": ["informaticist", "admin", "doctor", "nurse"],
        "source_model": "clinical.DataQualityIssue",
        "columns": [
            {"name": "id", "display_name": "Issue ID", "column_type": ColumnDataType.NUMBER, "is_primary": True, "order": 1},
            {"name": "rule_id", "display_name": "Rule ID", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 2},
            {"name": "table_name", "display_name": "Table Target", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 3},
            {"name": "check_type", "display_name": "Check Type", "column_type": ColumnDataType.SELECT, "options": ["Missingness", "Outlier", "Temporal Inconsistency"], "order": 4},
            {"name": "severity", "display_name": "Severity", "column_type": ColumnDataType.SELECT, "options": ["Low", "Medium", "High", "Critical"], "order": 5},
            {"name": "affected_records", "display_name": "Affected Count", "column_type": ColumnDataType.NUMBER, "order": 6},
            {"name": "status", "display_name": "Status", "column_type": ColumnDataType.SELECT, "options": ["Open", "Investigating", "Resolved"], "is_read_only": False, "order": 7},
            {"name": "reported_at", "display_name": "Reported At", "column_type": ColumnDataType.DATETIME, "order": 8},
        ],
    },
    {
        "slug": "clinical_workflow_metrics",
        "title": "Clinical Workflow Metrics",
        "description": "Triage latency, department throughput, and clinician decision support adoption.",
        "category": DatasetCategory.CLINICAL_OPS,
        "allowed_roles": ["informaticist", "admin", "doctor", "nurse"],
        "source_model": "clinical.WorkflowMetric",
        "columns": [
            {"name": "id", "display_name": "ID", "column_type": ColumnDataType.NUMBER, "is_primary": True, "order": 1},
            {"name": "department", "display_name": "Department", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 2},
            {"name": "avg_triage_latency_ms", "display_name": "Triage Latency (ms)", "column_type": ColumnDataType.NUMBER, "order": 3},
            {"name": "clinician_override_rate", "display_name": "Override Rate", "column_type": ColumnDataType.NUMBER, "order": 4},
            {"name": "active_backlog", "display_name": "Active Backlog", "column_type": ColumnDataType.NUMBER, "order": 5},
            {"name": "recorded_date", "display_name": "Date", "column_type": ColumnDataType.DATE, "order": 6},
        ],
    },
    {
        "slug": "api_telemetry",
        "title": "External API Telemetry",
        "description": "Outbound and inbound healthcare API latency, error budgets, and token usage.",
        "category": DatasetCategory.SYSTEM_TELEMETRY,
        "allowed_roles": ["informaticist", "admin"],
        "source_model": "external_apis.ApiLog",
        "columns": [
            {"name": "id", "display_name": "Log ID", "column_type": ColumnDataType.NUMBER, "is_primary": True, "order": 1},
            {"name": "service_name", "display_name": "Service Name", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 2},
            {"name": "endpoint", "display_name": "Endpoint", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 3},
            {"name": "status_code", "display_name": "Status Code", "column_type": ColumnDataType.NUMBER, "order": 4},
            {"name": "latency_ms", "display_name": "Latency (ms)", "column_type": ColumnDataType.NUMBER, "order": 5},
            {"name": "timestamp", "display_name": "Timestamp", "column_type": ColumnDataType.DATETIME, "order": 6},
        ],
    },
    {
        "slug": "whiteboard_metadata",
        "title": "Whiteboard Collaboration Metadata",
        "description": "Canvas document states, classification tiers, and version audit metrics.",
        "category": DatasetCategory.COLLABORATION,
        "allowed_roles": ["informaticist", "admin", "doctor"],
        "source_model": "whiteboards.ClinicalWhiteboard",
        "columns": [
            {"name": "id", "display_name": "ID", "column_type": ColumnDataType.NUMBER, "is_primary": True, "order": 1},
            {"name": "whiteboard_uid", "display_name": "Canvas UUID", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 2},
            {"name": "title", "display_name": "Title", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 3},
            {"name": "type", "display_name": "Type", "column_type": ColumnDataType.SINGLE_LINE_TEXT, "order": 4},
            {"name": "classification", "display_name": "Classification", "column_type": ColumnDataType.SELECT, "options": ["PUBLIC", "INTERNAL", "SENSITIVE", "PHI", "RESTRICTED"], "order": 5},
            {"name": "status", "display_name": "Status", "column_type": ColumnDataType.SELECT, "options": ["DRAFT", "IN_REVIEW", "APPROVED", "ARCHIVED"], "order": 6},
            {"name": "version", "display_name": "Version", "column_type": ColumnDataType.NUMBER, "order": 7},
            {"name": "updated_at", "display_name": "Updated At", "column_type": ColumnDataType.DATETIME, "order": 8},
        ],
    },
]


class SchemaService:
    @staticmethod
    def ensure_standard_datasets():
        """Idempotently ensures all standard analytical datasets and schema columns exist."""
        created_datasets = []
        for d_def in STANDARD_DATASETS:
            cols = d_def.get("columns", [])
            dataset, _ = NocoDBDataset.objects.get_or_create(
                slug=d_def["slug"],
                defaults={
                    "title": d_def["title"],
                    "description": d_def["description"],
                    "category": d_def["category"],
                    "allowed_roles": d_def["allowed_roles"],
                    "source_model": d_def.get("source_model", ""),
                    "is_active": True,
                    "is_system_dataset": True,
                },
            )
            for c_def in cols:
                NocoDBSchemaColumn.objects.get_or_create(
                    dataset=dataset,
                    name=c_def["name"],
                    defaults={
                        "display_name": c_def["display_name"],
                        "column_type": c_def["column_type"],
                        "is_primary": c_def.get("is_primary", False),
                        "is_phi": c_def.get("is_phi", False),
                        "is_read_only": c_def.get("is_read_only", True),
                        "options": c_def.get("options", []),
                        "order": c_def.get("order", 0),
                    },
                )
            created_datasets.append(dataset)
        return created_datasets
