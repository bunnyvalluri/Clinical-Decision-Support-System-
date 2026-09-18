"""
Management command to register trained ML model artifacts into PostgreSQL model_versions table.
"""
import json
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.model_registry.models import ModelStatus, ModelVersion


class Command(BaseCommand):
    help = "Seed trained ML model artifacts into the PostgreSQL model_versions registry."

    def handle(self, *args, **options):
        self.stdout.write("Scanning ml/artifacts/models for trained model artifacts...")
        repo_root = settings.BASE_DIR.parent
        artifacts_dir = repo_root / "ml" / "artifacts" / "models"

        if not artifacts_dir.exists():
            self.stdout.write(self.style.WARNING(f"Artifacts directory not found: {artifacts_dir}"))
            return

        seeded_count = 0
        for model_dir in sorted(artifacts_dir.iterdir()):
            if not model_dir.is_dir():
                continue

            for version_dir in sorted(model_dir.iterdir()):
                if not version_dir.is_dir():
                    continue

                meta_path = version_dir / "metadata.json"
                eval_path = version_dir / "evaluation.json"
                pipeline_path = version_dir / "pipeline.joblib"

                if not (meta_path.exists() and pipeline_path.exists()):
                    continue

                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)

                eval_data = {}
                if eval_path.exists():
                    with open(eval_path, "r", encoding="utf-8") as f:
                        eval_data = json.load(f)

                model_name = meta.get("model_name", meta.get("name", model_dir.name))
                version = meta.get("version", version_dir.name)
                algorithm = meta.get("algorithm", meta.get("model_type", "UNKNOWN"))

                rel_artifact_path = str(pipeline_path.relative_to(repo_root)).replace("\\", "/")

                # Primary production model: Random Forest
                default_status = (
                    ModelStatus.ACTIVE
                    if model_name == "random_forest_risk_model"
                    else ModelStatus.CANDIDATE
                )

                mv, created = ModelVersion.objects.update_or_create(
                    model_name=model_name,
                    version=version,
                    defaults={
                        "algorithm": algorithm,
                        "status": default_status,
                        "artifact_location": rel_artifact_path,
                        "accuracy": eval_data.get("accuracy"),
                        "precision": eval_data.get("precision_macro"),
                        "recall": eval_data.get("recall_macro"),
                        "f1_score": eval_data.get("f1_macro"),
                        "roc_auc": eval_data.get("roc_auc"),
                        "metrics": eval_data,
                        "hyperparameters": meta.get("hyperparameters", {}),
                        "training_dataset_identifier": meta.get("dataset_name", "clinical_risk_v1"),
                        "activated_at": timezone.now() if default_status == ModelStatus.ACTIVE else None,
                    },
                )

                action_str = "Created" if created else "Updated"
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  [+] {action_str} {mv.model_name} v{mv.version} [{mv.status}] (acc={mv.accuracy})"
                    )
                )

                # Seed DatasetVersion and ModelEvaluation
                from apps.model_registry.models import DatasetVersion, ModelEvaluation
                dv, _ = DatasetVersion.objects.get_or_create(
                    dataset_identifier="clinical_risk_v1",
                    defaults={
                        "version": "1.0.0",
                        "source": "EHR Inpatient Cohort (BPY-CSE-2666)",
                        "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                        "sample_count": 2501,
                        "feature_count": 16,
                        "approval_status": "APPROVED",
                    },
                )

                ModelEvaluation.objects.update_or_create(
                    model_version=mv,
                    dataset_version=dv,
                    defaults={
                        "metrics": eval_data,
                        "brier_score": eval_data.get("brier_score"),
                        "passed_safety_gates": float(eval_data.get("accuracy", 0.0) or 0.0) >= 0.75,
                    },
                )
                seeded_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully registered {seeded_count} models in PostgreSQL."))
