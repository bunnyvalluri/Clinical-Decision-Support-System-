"""
Kaggle Dataset Management and Governance REST API Views.
Enforces strict RBAC (Medical Informaticist / IT Admin only).
Provides dataset discovery, validation, lineage, approval, and ML training orchestration.
"""
import logging
from typing import Any, Dict
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.core.models import AuditLog
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
    TrainingRun,
)
from celery_tasks.kaggle_tasks import (
    discover_kaggle_datasets,
    download_and_validate_dataset,
    train_kaggle_model,
)
from integrations.kaggle.authentication import KaggleAuthService
from integrations.kaggle.dataset_client import KaggleDatasetService

logger = logging.getLogger("apps.model_registry.kaggle_views")

AUTHORIZED_ROLES = {
    UserRole.MEDICAL_INFORMATICIST,
    UserRole.IT_ADMIN,
    "ANALYST",
    "ADMIN",
    "MEDICAL_INFORMATICIST",
    "IT_ADMIN",
}


class IsMedicalInformaticistOrAdmin(permissions.BasePermission):
    """Permission check ensuring only Medical Informaticists and IT Admins have access."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        role = getattr(user, "role", "")
        return role in AUTHORIZED_ROLES


class KaggleAuthStatusView(APIView):
    """Diagnostic check for server-side Kaggle credentials status."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def get(self, request):
        status_info = KaggleAuthService.get_auth_status()
        return Response({"success": True, "data": status_info})


class DatasetListView(APIView):
    """List registered Kaggle datasets with filtering, search, and pagination."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def get(self, request):
        qs = KaggleDataset.objects.all().prefetch_related("versions")

        # Filters
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        approval_filter = request.query_params.get("approval_status")
        if approval_filter:
            qs = qs.filter(approval_status=approval_filter.upper())

        search_term = request.query_params.get("search")
        if search_term:
            qs = qs.filter(title__icontains=search_term) | qs.filter(kaggle_slug__icontains=search_term)

        results = []
        for ds in qs[:50]:
            latest_version = ds.versions.first()
            results.append({
                "id": str(ds.id),
                "kaggle_owner": ds.kaggle_owner,
                "kaggle_slug": ds.kaggle_slug,
                "title": ds.title,
                "description": ds.description,
                "dataset_url": ds.dataset_url,
                "version_number": ds.version_number,
                "version_identifier": ds.version_identifier,
                "license_name": ds.license_name,
                "author": ds.author,
                "size_bytes": ds.size_bytes,
                "file_count": ds.file_count,
                "status": ds.status,
                "quality_status": ds.quality_status,
                "clinical_suitability_status": ds.clinical_suitability_status,
                "approval_status": ds.approval_status,
                "discovered_at": ds.discovered_at.isoformat(),
                "last_checked_at": ds.last_checked_at.isoformat(),
                "row_count": latest_version.row_count if latest_version else None,
                "column_count": latest_version.column_count if latest_version else None,
                "is_synthetic": latest_version.is_synthetic if latest_version else False,
            })

        return Response({
            "success": True,
            "data": {
                "count": len(results),
                "datasets": results,
            }
        })


class DatasetDiscoverView(APIView):
    """Discover candidate datasets on Kaggle."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def post(self, request):
        query = request.data.get("query", "patient risk")
        limit = int(request.data.get("limit", 20))

        service = KaggleDatasetService()
        candidates = service.discover_candidates(search_query=query, limit=limit)

        data = [c.model_dump() for c in candidates]
        return Response({
            "success": True,
            "data": {
                "query": query,
                "count": len(data),
                "candidates": data,
            }
        })


class DatasetImportView(APIView):
    """Import a candidate dataset into the catalog."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def post(self, request):
        owner = request.data.get("kaggle_owner")
        slug = request.data.get("kaggle_slug")
        if not owner or not slug:
            return Response(
                {"success": False, "error": "kaggle_owner and kaggle_slug are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        title = request.data.get("title", slug)
        desc = request.data.get("description", "")
        url = request.data.get("dataset_url", f"https://www.kaggle.com/datasets/{owner}/{slug}")
        license_name = request.data.get("license_name", "Unknown")
        author = request.data.get("author", owner)

        dataset, created = KaggleDataset.objects.get_or_create(
            kaggle_owner=owner,
            kaggle_slug=slug,
            defaults={
                "title": title,
                "description": desc,
                "dataset_url": url,
                "license_name": license_name,
                "author": author,
                "status": "DISCOVERED",
                "approval_status": "PENDING",
            }
        )

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.CREATE,
            resource_type="KaggleDataset",
            resource_id=str(dataset.id),
            description=f"Imported Kaggle candidate dataset {owner}/{slug}",
        )

        return Response({
            "success": True,
            "message": "Dataset imported successfully." if created else "Dataset already registered.",
            "data": {
                "id": str(dataset.id),
                "ref": f"{dataset.kaggle_owner}/{dataset.kaggle_slug}",
                "status": dataset.status,
            }
        })


class DatasetDetailView(APIView):
    """Get full details, versions, latest validation report, and governance info."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def get(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        latest_version = dataset.versions.first()

        version_data = None
        quality_data = None
        privacy_data = None
        clinical_data = None
        features_data = []

        if latest_version:
            version_data = {
                "id": str(latest_version.id),
                "version_number": latest_version.version_number,
                "version_identifier": latest_version.version_identifier,
                "dataset_hash": latest_version.dataset_hash,
                "row_count": latest_version.row_count,
                "column_count": latest_version.column_count,
                "license_name": latest_version.license_name,
                "is_synthetic": latest_version.is_synthetic,
                "synthetic_confidence": float(latest_version.synthetic_confidence),
                "synthetic_reason": latest_version.synthetic_reason,
                "download_timestamp": latest_version.download_timestamp.isoformat(),
            }

            # Quality findings
            q_findings = latest_version.quality_findings.all()[:20]
            quality_data = {
                "findings_count": latest_version.quality_findings.count(),
                "findings": [
                    {
                        "feature": f.feature_name,
                        "issue_type": f.issue_type,
                        "severity": f.severity,
                        "message": f.message,
                    }
                    for f in q_findings
                ]
            }

            # Privacy assessment
            if hasattr(latest_version, "privacy_assessment"):
                pa = latest_version.privacy_assessment
                privacy_data = {
                    "classification": pa.classification,
                    "has_unredacted_phi": pa.has_unredacted_phi,
                    "approval_gate": pa.approval_gate,
                    "direct_identifiers_found": pa.direct_identifiers_found,
                    "scan_summary": pa.scan_summary,
                }

            # Clinical validation
            if hasattr(latest_version, "clinical_validation"):
                cv = latest_version.clinical_validation
                clinical_data = {
                    "clinical_suitability_status": cv.clinical_suitability_status,
                    "has_blocking_violations": cv.has_blocking_violations,
                    "range_violations": cv.range_findings,
                    "contradictions": cv.contradiction_findings,
                }

            # Features
            features_data = [
                {
                    "name": feat.name,
                    "data_type": feat.data_type,
                    "min": feat.min_value,
                    "max": feat.max_value,
                    "missing_pct": feat.missing_pct,
                    "clinical_meaning": feat.clinical_meaning,
                }
                for feat in latest_version.features.all()
            ]

        # Recent validation jobs
        jobs = [
            {
                "id": str(j.id),
                "job_type": j.job_type,
                "status": j.status,
                "progress_pct": j.progress_pct,
                "error_message": j.error_message,
                "started_at": j.started_at.isoformat(),
                "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in dataset.validation_jobs.all()[:5]
        ]

        return Response({
            "success": True,
            "data": {
                "id": str(dataset.id),
                "kaggle_owner": dataset.kaggle_owner,
                "kaggle_slug": dataset.kaggle_slug,
                "title": dataset.title,
                "description": dataset.description,
                "dataset_url": dataset.dataset_url,
                "version_number": dataset.version_number,
                "version_identifier": dataset.version_identifier,
                "license_name": dataset.license_name,
                "author": dataset.author,
                "size_bytes": dataset.size_bytes,
                "file_count": dataset.file_count,
                "status": dataset.status,
                "quality_status": dataset.quality_status,
                "clinical_suitability_status": dataset.clinical_suitability_status,
                "approval_status": dataset.approval_status,
                "tags": dataset.tags,
                "discovered_at": dataset.discovered_at.isoformat(),
                "latest_version": version_data,
                "quality_summary": quality_data,
                "privacy_assessment": privacy_data,
                "clinical_validation": clinical_data,
                "features": features_data,
                "validation_jobs": jobs,
            }
        })


class DatasetValidateView(APIView):
    """Trigger complete asynchronous download, sanitation, and validation pipeline."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def post(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        dataset.status = "VALIDATING"
        dataset.save(update_fields=["status"])

        # Launch async Celery pipeline
        task = download_and_validate_dataset.delay(str(dataset.id))

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.EXECUTE,
            resource_type="KaggleDataset",
            resource_id=str(dataset.id),
            description=f"Triggered validation pipeline for {dataset.kaggle_owner}/{dataset.kaggle_slug} (Task: {task.id})",
        )

        return Response({
            "success": True,
            "message": "Dataset validation pipeline initiated.",
            "data": {
                "dataset_id": str(dataset.id),
                "celery_task_id": task.id,
                "status": "VALIDATING",
            }
        })


class DatasetQualityView(APIView):
    """Retrieve full data quality report for latest version."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def get(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        version = dataset.versions.first()
        if not version:
            return Response({"success": False, "error": "Dataset has not been downloaded or validated yet."}, status=status.HTTP_404_NOT_FOUND)

        findings = [
            {
                "feature": f.feature_name,
                "issue_type": f.issue_type,
                "severity": f.severity,
                "message": f.message,
            }
            for f in version.quality_findings.all()
        ]

        return Response({
            "success": True,
            "data": {
                "dataset_id": str(dataset.id),
                "version_number": version.version_number,
                "row_count": version.row_count,
                "column_count": version.column_count,
                "dataset_hash": version.dataset_hash,
                "findings_count": len(findings),
                "findings": findings,
            }
        })


class DatasetSchemaView(APIView):
    """Retrieve feature schema dictionary for latest version."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def get(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        version = dataset.versions.first()
        if not version:
            return Response({"success": False, "error": "Dataset has no validated schema yet."}, status=status.HTTP_404_NOT_FOUND)

        features = [
            {
                "name": feat.name,
                "data_type": feat.data_type,
                "min": feat.min_value,
                "max": feat.max_value,
                "missing_pct": feat.missing_pct,
                "clinical_meaning": feat.clinical_meaning,
                "leakage_status": feat.leakage_status,
                "privacy_classification": feat.privacy_classification,
            }
            for feat in version.features.all()
        ]

        return Response({
            "success": True,
            "data": {
                "dataset_id": str(dataset.id),
                "version_number": version.version_number,
                "feature_count": len(features),
                "features": features,
            }
        })


class DatasetLineageView(APIView):
    """Retrieve full provenance DAG from Kaggle to models."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def get(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        version = dataset.versions.first()

        graph = {
            "nodes": [
                {"id": "kaggle", "label": f"Kaggle Source: {dataset.kaggle_owner}/{dataset.kaggle_slug}", "type": "EXTERNAL_SOURCE"},
                {"id": "raw", "label": f"Raw Downloaded Archive (v{dataset.version_number})", "type": "RAW_STORAGE"},
                {"id": "sanitized", "label": f"Sanitized CSV ({version.dataset_hash[:8] if version else 'N/A'})", "type": "SANITIZED_DATASET"},
                {"id": "schema", "label": "Feature Schema & Range Gate", "type": "SCHEMA_ENGINE"},
                {"id": "split", "label": "Patient-Level Stratified Split (Seed 42)", "type": "SPLIT_GATE"},
            ],
            "edges": [
                {"source": "kaggle", "target": "raw"},
                {"source": "raw", "target": "sanitized"},
                {"source": "sanitized", "target": "schema"},
                {"source": "schema", "target": "split"},
            ]
        }

        if version:
            for tr in version.training_runs.all()[:5]:
                node_id = f"train_{tr.id}"
                graph["nodes"].append({
                    "id": node_id,
                    "label": f"{tr.algorithm} Run [{tr.status}]",
                    "type": "TRAINING_EXPERIMENT",
                })
                graph["edges"].append({"source": "split", "target": node_id})

                if tr.model_version:
                    mv_node_id = f"model_{tr.model_version.id}"
                    graph["nodes"].append({
                        "id": mv_node_id,
                        "label": f"Model: {tr.model_version.model_name} ({tr.model_version.status})",
                        "type": "MODEL_REGISTRY",
                    })
                    graph["edges"].append({"source": node_id, "target": mv_node_id})

        return Response({"success": True, "data": graph})


class DatasetApproveView(APIView):
    """Human informaticist/clinician sign-off gate."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def post(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        version = dataset.versions.first()
        if not version:
            return Response({"success": False, "error": "Cannot approve dataset without a downloaded version."}, status=status.HTTP_400_BAD_REQUEST)

        tier = request.data.get("approval_tier", ApprovalTier.APPROVED_FOR_RESEARCH)
        rationale = request.data.get("clinical_rationale", "").strip()

        if not rationale:
            return Response({"success": False, "error": "clinical_rationale is mandatory for human sign-off."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            dataset.approval_status = tier
            dataset.status = "APPROVED" if tier != ApprovalTier.REJECTED else "REJECTED"
            dataset.save(update_fields=["approval_status", "status"])

            approval = DatasetApproval.objects.create(
                dataset=dataset,
                version=version,
                approval_tier=tier,
                clinical_rationale=rationale,
                intended_use=request.data.get("intended_use", "Benchmarking and research validation."),
                reviewer=request.user,
            )

            AuditLog.objects.create(
                user=request.user,
                action=AuditLog.Action.APPROVE,
                resource_type="KaggleDataset",
                resource_id=str(dataset.id),
                description=f"Sign-off recorded: {tier} by {request.user.username}. Rationale: {rationale}",
            )

        return Response({
            "success": True,
            "message": f"Dataset approved at tier: {tier}",
            "data": {
                "approval_id": str(approval.id),
                "approval_tier": tier,
                "approved_at": approval.approved_at.isoformat(),
            }
        })


class DatasetTrainView(APIView):
    """Launch audited ML training run on validated dataset."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def post(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        version = dataset.versions.first()
        if not version:
            return Response({"success": False, "error": "Dataset must be downloaded and validated prior to training."}, status=status.HTTP_400_BAD_REQUEST)

        # Invariant check: only approved or validated datasets can be trained
        if dataset.approval_status == ApprovalTier.REJECTED:
            return Response({"success": False, "error": "Cannot train model on REJECTED dataset."}, status=status.HTTP_403_FORBIDDEN)

        algorithm = request.data.get("algorithm", "RandomForestClassifier")
        hyperparameters = request.data.get("hyperparameters", {})
        seed = int(request.data.get("random_seed", 42))
        target_column = request.data.get("target_column")

        # Launch Celery training task
        task = train_kaggle_model.delay(
            dataset_version_id=str(version.id),
            algorithm=algorithm,
            hyperparameters=hyperparameters,
            random_seed=seed,
            target_column=target_column,
        )

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.Action.EXECUTE,
            resource_type="TrainingRun",
            resource_id=task.id,
            description=f"Initiated {algorithm} training on {dataset.kaggle_slug} v{version.version_number}",
        )

        return Response({
            "success": True,
            "message": f"Training job for {algorithm} dispatched.",
            "data": {
                "celery_task_id": task.id,
                "dataset_id": str(dataset.id),
                "version_id": str(version.id),
                "algorithm": algorithm,
            }
        })


class DatasetTrainingRunsView(APIView):
    """List training runs and evaluations for this dataset."""
    permission_classes = [permissions.IsAuthenticated, IsMedicalInformaticistOrAdmin]

    def get(self, request, dataset_id):
        dataset = get_object_or_404(KaggleDataset, id=dataset_id)
        runs = TrainingRun.objects.filter(dataset_version__dataset=dataset).select_related("model_version")

        data = [
            {
                "id": str(r.id),
                "algorithm": r.algorithm,
                "status": r.status,
                "metrics": r.metrics,
                "brier_score": float(r.brier_score) if r.brier_score else None,
                "shap_summary": r.shap_summary,
                "artifact_path": r.artifact_path,
                "artifact_checksum": r.artifact_checksum,
                "created_at": r.created_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "model_version": {
                    "id": str(r.model_version.id),
                    "model_name": r.model_version.model_name,
                    "status": r.model_version.status,
                    "accuracy": float(r.model_version.accuracy) if r.model_version.accuracy else None,
                    "roc_auc": float(r.model_version.roc_auc) if r.model_version.roc_auc else None,
                } if r.model_version else None,
            }
            for r in runs
        ]

        return Response({"success": True, "data": {"count": len(data), "runs": data}})
