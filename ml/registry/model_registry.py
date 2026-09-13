"""
Model Registry for persisting and loading versioned ML artifacts.
Saves the integrated preprocessing pipeline, estimator, hyperparameters,
and evaluation metrics together in reproducible directory trees.
"""
import json
from pathlib import Path
from typing import Any
import joblib
from sklearn.pipeline import Pipeline

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"


class ModelRegistry:
    """
    Filesystem-based Model Registry for clinical risk models.
    Structure:
      ml/artifacts/models/<model_name>/<version>/
        ├── pipeline.joblib
        ├── metadata.json
        └── evaluation.json
    """

    def __init__(self, base_dir: Path | str | None = None) -> None:
        self.base_dir = Path(base_dir) if base_dir else (ARTIFACTS_DIR / "models")
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_model(
        self,
        name: str,
        version: str,
        pipeline: Pipeline,
        model_type: str,
        dataset_name: str,
        hyperparameters: dict[str, Any] | None = None,
        metrics: dict[str, Any] | None = None,
        feature_names: list[str] | None = None,
    ) -> Path:
        """Persist pipeline, metadata, and evaluation results as a versioned bundle."""
        version_dir = self.base_dir / name / version
        version_dir.mkdir(parents=True, exist_ok=True)

        # 1. Save serialized Pipeline (preprocessor + estimator)
        pipeline_path = version_dir / "pipeline.joblib"
        joblib.dump(pipeline, pipeline_path)

        # 2. Save metadata.json
        from datetime import datetime, timezone
        metadata = {
            "name": name,
            "version": version,
            "model_type": model_type,
            "dataset_name": dataset_name,
            "saved_at": datetime.now(timezone.utc).isoformat(),
            "hyperparameters": hyperparameters or {},
            "feature_names": feature_names or [],
            "status": "ACTIVE",
        }
        metadata_path = version_dir / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        # 3. Save evaluation.json if metrics provided
        if metrics:
            eval_path = version_dir / "evaluation.json"
            with open(eval_path, "w", encoding="utf-8") as f:
                json.dump(metrics, f, indent=2)

        return version_dir

    def load_model(
        self, name: str, version: str | None = None
    ) -> tuple[Pipeline, dict[str, Any], dict[str, Any]]:
        """
        Load pipeline and metadata. If version is omitted, loads the latest version.
        Returns: (pipeline, metadata, evaluation_metrics)
        """
        model_dir = self.base_dir / name
        if not model_dir.exists():
            raise FileNotFoundError(f"No model found under name '{name}' in {self.base_dir}")

        if version:
            version_dir = model_dir / version
            if not version_dir.exists():
                raise FileNotFoundError(f"Model '{name}' version '{version}' not found.")
        else:
            # Find latest version directory alphabetically/by timestamp
            versions = sorted([d for d in model_dir.iterdir() if d.is_dir()])
            if not versions:
                raise FileNotFoundError(f"No versions found for model '{name}'.")
            version_dir = versions[-1]

        pipeline_file = version_dir / "pipeline.joblib"
        if not pipeline_file.exists():
            raise FileNotFoundError(f"Pipeline artifact not found in {version_dir}")

        pipeline: Pipeline = joblib.load(pipeline_file)

        metadata_file = version_dir / "metadata.json"
        metadata: dict[str, Any] = {}
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)

        evaluation_file = version_dir / "evaluation.json"
        evaluation: dict[str, Any] = {}
        if evaluation_file.exists():
            with open(evaluation_file, "r", encoding="utf-8") as f:
                evaluation = json.load(f)

        return pipeline, metadata, evaluation

    def list_models(self) -> list[dict[str, Any]]:
        """List all registered models and their available versions."""
        registered = []
        if not self.base_dir.exists():
            return registered

        for model_path in self.base_dir.iterdir():
            if model_path.is_dir():
                for version_path in model_path.iterdir():
                    if version_path.is_dir():
                        meta_file = version_path / "metadata.json"
                        if meta_file.exists():
                            with open(meta_file, "r", encoding="utf-8") as f:
                                registered.append(json.load(f))
                        else:
                            registered.append({
                                "name": model_path.name,
                                "version": version_path.name,
                            })
        return registered
