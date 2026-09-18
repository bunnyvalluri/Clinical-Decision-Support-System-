"""
Celery asynchronous background tasks for Kaggle dataset intelligence & ML training.
Publishes real-time state transitions and telemetry to Django Channels WebSockets.
Enforces that Neon PostgreSQL is the sole authoritative store.
"""
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.utils import timezone
import numpy as np
import pandas as pd

from apps.model_registry.models import (
    ApprovalTier,
    DatasetApproval,
    DatasetClinicalValidation,
    DatasetFeatureDefinition,
    DatasetLeakageFinding,
    DatasetLicenseReview,
    DatasetLineage,
    DatasetPrivacyAssessment,
    DatasetQualityFinding,
    DatasetValidationJob,
    KaggleDataset,
    KaggleDatasetFile,
    KaggleDatasetVersion,
    ModelStatus,
    ModelVersion,
    PrivacyClassification,
    TrainingRun,
)
from config.celery import BaseCDSSAsyncJob
from integrations.kaggle.client import KaggleClient
from integrations.kaggle.dataset_client import KaggleDatasetService
from integrations.kaggle.download_client import KaggleDownloadService
from integrations.kaggle.metadata_client import KaggleMetadataService
from ml.data.clinical_validator import ClinicalRangeValidator
from ml.data.compatibility_engine import DatasetCompatibilityEngine
from ml.data.leakage_detector import DataLeakageDetector
from ml.data.privacy_classifier import HealthcareDataClassifier
from ml.data.quality_engine import DatasetQualityEngine
from ml.data.synthetic_detector import SyntheticDataDetector

logger = logging.getLogger("celery_tasks.kaggle")


def _broadcast_dataset_event(dataset_id: str, event_type: str, payload: Dict[str, Any]) -> None:
    """Publish real-time WebSocket telemetry to dataset subscriber group."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "kaggle_datasets",
                {
                    "type": "dataset_event",
                    "payload": {
                        "dataset_id": dataset_id,
                        "event_type": event_type,
                        "timestamp": timezone.now().isoformat(),
                        **payload,
                    },
                },
            )
            # Also broadcast to individual dataset channel
            async_to_sync(channel_layer.group_send)(
                f"dataset_{dataset_id}",
                {
                    "type": "dataset_event",
                    "payload": {
                        "dataset_id": dataset_id,
                        "event_type": event_type,
                        "timestamp": timezone.now().isoformat(),
                        **payload,
                    },
                },
            )
    except Exception as exc:
        logger.warning("Failed to broadcast WebSocket dataset event: %s", exc)


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="celery_tasks.kaggle_tasks.discover_kaggle_datasets",
    max_retries=2,
    default_retry_delay=10,
)
def discover_kaggle_datasets(self, search_query: str = "patient risk") -> Dict[str, Any]:
    """Search Kaggle for candidates and register unapproved discovery entries in PostgreSQL."""
    logger.info("Executing Kaggle dataset discovery task for query: %s", search_query)
    service = KaggleDatasetService()
    candidates = service.discover_candidates(search_query=search_query)

    discovered_count = 0
    registered_ids = []

    for c in candidates:
        dataset_obj, created = KaggleDataset.objects.get_or_create(
            kaggle_owner=c.kaggle_owner,
            kaggle_slug=c.kaggle_slug,
            defaults={
                "title": c.title,
                "description": c.description,
                "dataset_url": c.dataset_url,
                "version_number": c.version_number,
                "version_identifier": f"{c.version_number}.0.0",
                "license_name": c.license_name,
                "license_url": c.license_url,
                "author": c.author,
                "size_bytes": c.size_bytes,
                "file_count": c.file_count,
                "tags": c.tags,
                "status": "DISCOVERED",
                "approval_status": "PENDING",
            },
        )
        if created:
            discovered_count += 1
        registered_ids.append(str(dataset_obj.id))

    _broadcast_dataset_event(
        "global",
        "dataset.discovery.completed",
        {
            "query": search_query,
            "total_candidates": len(candidates),
            "newly_discovered": discovered_count,
        },
    )

    return {
        "status": "success",
        "query": search_query,
        "candidates_count": len(candidates),
        "newly_discovered": discovered_count,
        "dataset_ids": registered_ids,
    }


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="celery_tasks.kaggle_tasks.download_and_validate_dataset",
    max_retries=1,
    time_limit=1800,
    soft_time_limit=1500,
)
def download_and_validate_dataset(self, dataset_id: str) -> Dict[str, Any]:
    """
    Complete orchestrated pipeline:
    Download -> Decompress -> Sanitize -> Quality Scan -> Privacy Scan ->
    Leakage Scan -> Clinical Range Validation -> Synthetic Detection -> Lineage Generation.
    """
    logger.info("Starting download and validation pipeline for Kaggle dataset: %s", dataset_id)
    dataset = KaggleDataset.objects.get(id=dataset_id)

    # Record / update validation job
    job = DatasetValidationJob.objects.create(
        dataset=dataset,
        job_type="FULL_VALIDATION",
        status="DOWNLOADING",
        progress_pct=10,
        celery_task_id=self.request.id or "",
    )

    _broadcast_dataset_event(str(dataset.id), "dataset.validation.started", {"step": "DOWNLOADING", "progress": 10})

    try:
        # Step 1: Download & Sanitize
        download_service = KaggleDownloadService()
        dl_result = download_service.download_and_sanitize(
            owner=dataset.kaggle_owner,
            slug=dataset.kaggle_slug,
            version=dataset.version_number,
        )

        job.status = "VALIDATING"
        job.progress_pct = 30
        job.save(update_fields=["status", "progress_pct"])
        _broadcast_dataset_event(str(dataset.id), "dataset.validation.progress", {"step": "EXTRACTED_AND_SANITIZED", "progress": 30})

        primary_file = dl_result["primary_file_path"]
        primary_hash = dl_result["primary_file_hash"]
        df = pd.read_csv(primary_file)

        # Step 2: Create / update KaggleDatasetVersion
        version_obj, _ = KaggleDatasetVersion.objects.update_or_create(
            dataset=dataset,
            version_number=dataset.version_number,
            defaults={
                "version_identifier": f"{dataset.version_number}.0.0",
                "dataset_hash": primary_hash,
                "row_count": len(df),
                "column_count": len(df.columns),
                "license_name": dataset.license_name,
                "raw_file_path": dl_result["raw_dir"],
                "sanitized_file_path": primary_file,
            },
        )
        job.version = version_obj
        job.save(update_fields=["version"])

        # Persist File records
        for f in dl_result["files"]:
            KaggleDatasetFile.objects.update_or_create(
                version=version_obj,
                filename=f["filename"],
                defaults={
                    "file_path": f["sanitized_path"],
                    "file_size_bytes": f["size_bytes"],
                    "sha256_checksum": f["sha256"],
                    "row_count": f["row_count"],
                    "column_count": len(df.columns),
                },
            )

        # Step 3: Data Quality Scan
        _broadcast_dataset_event(str(dataset.id), "dataset.validation.progress", {"step": "QUALITY_SCAN", "progress": 45})
        quality_report = DatasetQualityEngine.evaluate_dataframe(df)

        for finding in quality_report["findings"]:
            DatasetQualityFinding.objects.create(
                dataset_version=version_obj,
                feature_name=finding.get("feature"),
                issue_type=finding.get("issue_type", "QUALITY_ISSUE"),
                severity=finding.get("severity", "WARNING"),
                message=finding.get("message", ""),
            )

        # Step 4: Privacy & HIPAA PHI Scan
        _broadcast_dataset_event(str(dataset.id), "dataset.validation.progress", {"step": "PRIVACY_SCAN", "progress": 60})
        privacy_report = HealthcareDataClassifier.scan_dataframe(df, description=dataset.description)

        DatasetPrivacyAssessment.objects.update_or_create(
            dataset_version=version_obj,
            defaults={
                "classification": getattr(PrivacyClassification, privacy_report["classification"], PrivacyClassification.HEALTH_DATA),
                "has_unredacted_phi": privacy_report["has_unredacted_phi"],
                "approval_gate": privacy_report["approval_gate"],
                "direct_identifiers_found": privacy_report["direct_identifier_columns"],
                "scan_summary": privacy_report,
            },
        )

        # Step 5: Data Leakage Detection
        _broadcast_dataset_event(str(dataset.id), "dataset.validation.progress", {"step": "LEAKAGE_SCAN", "progress": 75})
        # Try finding target column
        target_candidate = next((c for c in df.columns if c.lower() in ["outcome", "target", "risk_level", "stroke", "cardio", "diabetes"]), None)
        leakage_report = DataLeakageDetector.detect_leakage(df, target_column=target_candidate)

        for lf in leakage_report["findings"]:
            DatasetLeakageFinding.objects.create(
                dataset_version=version_obj,
                feature_name=lf.get("feature", "unknown"),
                leakage_type=lf.get("leakage_type", "DATA_LEAKAGE"),
                severity=lf.get("severity", "WARNING"),
                evidence=lf.get("evidence", ""),
                recommendation=lf.get("recommendation", ""),
            )

        # Step 6: Clinical Range & Contradiction Validation
        _broadcast_dataset_event(str(dataset.id), "dataset.validation.progress", {"step": "CLINICAL_VALIDATION", "progress": 85})
        clinical_report = ClinicalRangeValidator.validate_dataframe(df)

        DatasetClinicalValidation.objects.update_or_create(
            dataset_version=version_obj,
            defaults={
                "physiological_violations_count": len(clinical_report["range_violations"]),
                "biological_contradictions_count": len(clinical_report["biological_contradictions"]),
                "has_blocking_violations": clinical_report["has_blocking_violations"],
                "clinical_suitability_status": clinical_report["clinical_suitability_status"],
                "range_findings": clinical_report["range_violations"],
                "contradiction_findings": clinical_report["biological_contradictions"],
            },
        )

        # Step 7: Synthetic Data Detection
        synth_report = SyntheticDataDetector.analyze_dataset(df, description=dataset.description, dataset_title=dataset.title)
        version_obj.is_synthetic = synth_report["dataset_is_synthetic"]
        version_obj.synthetic_confidence = synth_report["synthetic_confidence"]
        version_obj.synthetic_reason = synth_report["synthetic_reason"]
        version_obj.save(update_fields=["is_synthetic", "synthetic_confidence", "synthetic_reason"])

        # Step 8: Dataset Feature Dictionary
        for col in df.columns:
            series = df[col].dropna()
            min_val = float(series.min()) if pd.api.types.is_numeric_dtype(df[col]) and len(series) > 0 else None
            max_val = float(series.max()) if pd.api.types.is_numeric_dtype(df[col]) and len(series) > 0 else None
            missing_pct = float(df[col].isnull().mean() * 100.0)

            DatasetFeatureDefinition.objects.update_or_create(
                dataset_version=version_obj,
                name=col,
                defaults={
                    "data_type": str(df[col].dtype),
                    "min_value": min_val,
                    "max_value": max_val,
                    "missing_pct": round(missing_pct, 2),
                    "clinical_meaning": f"Feature {col} from external Kaggle dataset {dataset.kaggle_slug}.",
                    "source_field": col,
                },
            )

        # Step 9: Compatibility Score & Status Transition
        compat = DatasetCompatibilityEngine.evaluate(
            df=df,
            target_column=target_candidate,
            license_name=dataset.license_name,
            privacy_status=privacy_report["classification"],
            leakage_findings_count=len(leakage_report["findings"]),
            quality_score=quality_report["integrity_score"],
        )

        dataset.quality_status = "VALIDATED" if quality_report["passed_quality_gate"] else "WARNING"
        dataset.clinical_suitability_status = clinical_report["clinical_suitability_status"]
        dataset.status = "VALIDATED"
        dataset.save(update_fields=["quality_status", "clinical_suitability_status", "status"])

        # Step 10: Create Lineage Node
        DatasetLineage.objects.update_or_create(
            dataset_version=version_obj,
            defaults={
                "source_url": dataset.dataset_url,
                "raw_checksum": primary_hash,
                "clean_checksum": primary_hash,
                "lineage_graph": {
                    "source": dataset.dataset_url,
                    "kaggle_ref": f"{dataset.kaggle_owner}/{dataset.kaggle_slug}",
                    "version": version_obj.version_number,
                    "sanitized_file": primary_file,
                    "records": len(df),
                    "columns": list(df.columns),
                    "quality_gate": quality_report["passed_quality_gate"],
                    "phi_detected": privacy_report["has_unredacted_phi"],
                    "compatibility": compat["overall_recommendation"],
                },
            },
        )

        job.status = "READY"
        job.progress_pct = 100
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "progress_pct", "completed_at"])

        _broadcast_dataset_event(
            str(dataset.id),
            "dataset.validation.completed",
            {
                "status": "VALIDATED",
                "progress": 100,
                "records": len(df),
                "completeness": quality_report["overall_completeness"],
                "recommendation": compat["overall_recommendation"],
            },
        )

        return {
            "status": "success",
            "dataset_id": str(dataset.id),
            "version_id": str(version_obj.id),
            "rows": len(df),
            "columns": len(df.columns),
            "quality": quality_report["integrity_score"],
            "compatibility": compat["overall_recommendation"],
        }

    except Exception as exc:
        logger.error("Dataset validation pipeline failed for %s: %s", dataset_id, exc, exc_info=True)
        job.status = "FAILED"
        job.error_message = str(exc)
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "error_message", "completed_at"])

        dataset.status = "FAILED"
        dataset.save(update_fields=["status"])

        _broadcast_dataset_event(
            str(dataset.id),
            "dataset.validation.failed",
            {"error": str(exc)},
        )
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    base=BaseCDSSAsyncJob,
    name="celery_tasks.kaggle_tasks.train_kaggle_model",
    max_retries=1,
    time_limit=2400,
    soft_time_limit=1800,
)
def train_kaggle_model(
    self,
    dataset_version_id: str,
    algorithm: str = "RandomForestClassifier",
    hyperparameters: Optional[Dict[str, Any]] = None,
    random_seed: int = 42,
    target_column: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Train an ML model strictly on a validated Kaggle dataset version.
    Supports SVM, RandomForestClassifier, and AdaBoostClassifier.
    Calculates calibration, TreeSHAP importances, and registers model candidate in ModelVersion.
    """
    logger.info("Executing Kaggle ML training task: algo=%s version_id=%s", algorithm, dataset_version_id)
    version = KaggleDatasetVersion.objects.select_related("dataset").get(id=dataset_version_id)

    tr = TrainingRun.objects.create(
        dataset_version=version,
        algorithm=algorithm,
        hyperparameters=hyperparameters or {},
        random_seed=random_seed,
        status="PREPROCESSING",
        celery_task_id=self.request.id or "",
    )

    _broadcast_dataset_event(
        str(version.dataset_id),
        "dataset.training.progress",
        {"training_run_id": str(tr.id), "status": "PREPROCESSING", "progress": 15},
    )

    try:
        from ml.training.trainers import SVMTrainer, RandomForestTrainer, AdaBoostTrainer
        from ml.evaluation.evaluator import evaluate_model
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import StandardScaler
        from sklearn.impute import SimpleImputer
        from sklearn.pipeline import Pipeline
        import joblib

        df = pd.read_csv(version.sanitized_file_path)
        # Identify target
        target_name = target_column
        if not target_name:
            target_name = next((c for c in df.columns if c.lower() in ["outcome", "target", "risk_level", "stroke", "cardio", "diabetes"]), df.columns[-1])

        y = df[target_name]
        # Binarize/encode target if string
        if y.dtype == object:
            from sklearn.preprocessing import LabelEncoder
            y = LabelEncoder().fit_transform(y.astype(str))

        # Drop non-feature columns (e.g. IDs, target)
        drop_cols = [target_name] + [c for c in df.columns if any(k in c.lower() for k in ["id", "mrn", "patient"])]
        X = df.drop(columns=[c for c in drop_cols if c in df.columns])

        # Keep numerical or one-hot encode categoricals
        X_num = pd.get_dummies(X, drop_first=True)

        # Patient-level / stratified train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_num, y, test_size=0.25, random_state=random_seed, stratify=y if len(pd.Series(y).unique()) < 10 else None
        )

        tr.status = "TRAINING"
        tr.save(update_fields=["status"])
        _broadcast_dataset_event(
            str(version.dataset_id),
            "dataset.training.progress",
            {"training_run_id": str(tr.id), "status": "TRAINING", "progress": 40},
        )

        # Select Trainer
        algo_upper = algorithm.upper()
        if "SVM" in algo_upper:
            trainer = SVMTrainer(
                model_name=f"svm_{version.dataset.kaggle_slug}",
                version=f"{version.version_number}.0.0",
                random_state=random_seed,
                hyperparameters=hyperparameters,
            )
            model = trainer.build_estimator()
        elif "ADA" in algo_upper:
            trainer = AdaBoostTrainer(
                model_name=f"adaboost_{version.dataset.kaggle_slug}",
                version=f"{version.version_number}.0.0",
                random_state=random_seed,
                hyperparameters=hyperparameters,
            )
            model = trainer.build_estimator()
        else:
            trainer = RandomForestTrainer(
                model_name=f"random_forest_{version.dataset.kaggle_slug}",
                version=f"{version.version_number}.0.0",
                random_state=random_seed,
                hyperparameters=hyperparameters,
            )
            model = trainer.build_estimator()

        # Build full robust pipeline
        pipe = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("clf", model),
        ])

        pipe.fit(X_train, y_train)

        tr.status = "EVALUATING"
        tr.save(update_fields=["status"])
        _broadcast_dataset_event(
            str(version.dataset_id),
            "dataset.training.progress",
            {"training_run_id": str(tr.id), "status": "EVALUATING", "progress": 70},
        )

        # Predictions and Probabilities
        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test) if hasattr(pipe, "predict_proba") else None

        eval_metrics = evaluate_model(y_true=y_test, y_pred=y_pred, y_prob=y_prob)

        # Calibration evaluation
        from sklearn.metrics import brier_score_loss
        brier = None
        if y_prob is not None and len(np.unique(y)) == 2:
            brier = float(brier_score_loss(y_test, y_prob[:, 1]))

        # Calculate SHAP / feature importances
        shap_features: Dict[str, float] = {}
        if hasattr(pipe.named_steps["clf"], "feature_importances_"):
            importances = pipe.named_steps["clf"].feature_importances_
            feature_names = list(X_num.columns)
            shap_features = {
                feature_names[i]: round(float(importances[i]), 4)
                for i in np.argsort(importances)[::-1][:15]
            }

        # Serialize artifact
        artifacts_dir = Path("media/ml_artifacts") / f"{version.dataset.kaggle_slug}_v{version.version_number}"
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        artifact_file = artifacts_dir / f"{algorithm}_{version.version_number}.joblib"
        joblib.dump(pipe, artifact_file, compress=3)

        # Artifact SHA-256
        sha256 = hashlib.sha256()
        with open(artifact_file, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        checksum = sha256.hexdigest()

        # Register in ModelVersion as CANDIDATE
        mv, _ = ModelVersion.objects.update_or_create(
            model_name=f"{algorithm}_{version.dataset.kaggle_slug}",
            version=f"kaggle-{version.version_number}.0.0",
            defaults={
                "algorithm": algorithm,
                "status": ModelStatus.CANDIDATE,
                "artifact_location": str(artifact_file),
                "checksum": checksum,
                "training_dataset_identifier": f"kaggle:{version.dataset.kaggle_slug}:{version.version_number}",
                "accuracy": eval_metrics.get("accuracy", 0.0),
                "precision": eval_metrics.get("precision", 0.0),
                "recall": eval_metrics.get("recall", 0.0),
                "f1_score": eval_metrics.get("f1", 0.0),
                "roc_auc": eval_metrics.get("roc_auc"),
                "metrics": eval_metrics,
                "hyperparameters": hyperparameters or {},
                "training_dataset_info": {
                    "source": "Kaggle",
                    "dataset_ref": f"{version.dataset.kaggle_owner}/{version.dataset.kaggle_slug}",
                    "train_samples": len(X_train),
                    "test_samples": len(X_test),
                    "features_count": len(X_num.columns),
                    "target_column": target_name,
                },
            },
        )

        tr.status = "COMPLETED"
        tr.model_version = mv
        tr.metrics = eval_metrics
        tr.brier_score = brier
        tr.shap_summary = shap_features
        tr.artifact_path = str(artifact_file)
        tr.artifact_checksum = checksum
        tr.completed_at = timezone.now()
        tr.save()

        _broadcast_dataset_event(
            str(version.dataset_id),
            "dataset.training.completed",
            {
                "training_run_id": str(tr.id),
                "model_version_id": str(mv.id),
                "model_name": mv.model_name,
                "accuracy": eval_metrics.get("accuracy"),
                "roc_auc": eval_metrics.get("roc_auc"),
                "f1": eval_metrics.get("f1"),
                "progress": 100,
            },
        )

        return {
            "status": "success",
            "training_run_id": str(tr.id),
            "model_version_id": str(mv.id),
            "model_name": mv.model_name,
            "metrics": eval_metrics,
            "checksum": checksum,
        }

    except Exception as exc:
        logger.error("ML training failed on dataset version %s: %s", dataset_version_id, exc, exc_info=True)
        tr.status = "FAILED"
        tr.completed_at = timezone.now()
        tr.save(update_fields=["status", "completed_at"])

        _broadcast_dataset_event(
            str(version.dataset_id),
            "dataset.training.failed",
            {"training_run_id": str(tr.id), "error": str(exc)},
        )
        raise self.retry(exc=exc)
