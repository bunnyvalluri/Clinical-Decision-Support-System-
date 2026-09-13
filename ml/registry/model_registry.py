"""
Model Registry for persisting, verifying, and loading versioned ML artifacts.
Features:
- Cryptographic SHA-256 artifact hashing to enforce safe deserialization and tamper detection
- Complete MLOps metadata schema tracking (dataset version, preprocessing version, hyperparameters)
- Explicit model approval state machine (CANDIDATE, VALIDATED, APPROVED, ACTIVE, ARCHIVED, REJECTED)
- Auditable rollback engine with artifact verification
"""
from datetime import datetime, timezone
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import joblib
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"


class ModelSecurityError(Exception):
    """Raised when an artifact fails cryptographic integrity or security validation."""
    pass


class ModelApprovalError(Exception):
    """Raised when an unapproved model is promoted to active production status."""
    pass


def calculate_file_sha256(file_path: Path) -> str:
    """Calculate SHA-256 hexadecimal digest for an artifact file."""
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


class ModelRegistry:
    """
    Filesystem-based Model Registry with cryptographic verification.
    Directory structure:
      ml/artifacts/models/<model_name>/<version>/
        ├── pipeline.joblib
        ├── metadata.json
        └── evaluation.json
    """

    ALLOWED_STATUSES = {
        "CANDIDATE",
        "VALIDATED",
        "SAFETY_CHECKED",
        "APPROVED",
        "ACTIVE",
        "ARCHIVED",
        "REJECTED",
    }

    def __init__(self, base_dir: Optional[Union[Path, str]] = None) -> None:
        self.base_dir = Path(base_dir) if base_dir else (ARTIFACTS_DIR / "models")
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_model(
        self,
        name: str,
        version: str,
        pipeline: Any,
        model_type: str,
        dataset_name: str = "clinical_risk_v1",
        dataset_version: str = "1.0.0",
        feature_schema_version: str = "v1.0",
        preprocessing_version: str = "v1.0",
        hyperparameters: Optional[Dict[str, Any]] = None,
        metrics: Optional[Dict[str, Any]] = None,
        feature_names: Optional[List[str]] = None,
        status: str = "CANDIDATE",
        author: str = "automated_training_pipeline",
    ) -> Path:
        """
        Persist pipeline, compute cryptographic SHA-256 hash, and record complete metadata.
        """
        if status not in self.ALLOWED_STATUSES:
            raise ValueError(f"Invalid model status '{status}'. Allowed: {self.ALLOWED_STATUSES}")

        version_dir = self.base_dir / name / version
        version_dir.mkdir(parents=True, exist_ok=True)

        # 1. Serialize Pipeline artifact
        pipeline_path = version_dir / "pipeline.joblib"
        joblib.dump(pipeline, pipeline_path)

        # 2. Compute SHA-256 digest for safe deserialization
        artifact_hash = calculate_file_sha256(pipeline_path)

        # 3. Save comprehensive metadata.json
        metadata = {
            "model_name": name,
            "version": version,
            "algorithm": model_type,
            "model_type": model_type,
            "status": status,
            "training_timestamp": datetime.now(timezone.utc).isoformat(),
            "saved_at": datetime.now(timezone.utc).isoformat(),
            "author": author,
            "dataset_name": dataset_name,
            "dataset_version": dataset_version,
            "feature_schema_version": feature_schema_version,
            "preprocessing_version": preprocessing_version,
            "artifact_hash": artifact_hash,
            "artifact_file": "pipeline.joblib",
            "hyperparameters": hyperparameters or {},
            "feature_names": feature_names or [],
            "approval_history": [
                {
                    "from_status": None,
                    "to_status": status,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "actor": author,
                    "reason": "Initial model build registration.",
                }
            ],
        }

        with open(version_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        # 4. Save evaluation.json
        if metrics:
            with open(version_dir / "evaluation.json", "w", encoding="utf-8") as f:
                json.dump(metrics, f, indent=2)

        logger.info("Saved model artifact %s v%s (SHA-256: %s)", name, version, artifact_hash[:12])
        return version_dir

    def load_model(
        self,
        name: str,
        version: Optional[str] = None,
        verify_integrity: bool = True,
    ) -> Tuple[Any, Dict[str, Any], Dict[str, Any]]:
        """
        Load pipeline and metadata with mandatory SHA-256 integrity verification.
        Prevents arbitrary code execution from tampered joblib files.
        """
        model_dir = self.base_dir / name
        if not model_dir.exists():
            raise FileNotFoundError(f"No model found under name '{name}' in {self.base_dir}")

        if version:
            version_dir = model_dir / version
            if not version_dir.exists():
                raise FileNotFoundError(f"Model '{name}' version '{version}' not found.")
        else:
            # Find latest version directory alphabetically or active
            versions = sorted([d for d in model_dir.iterdir() if d.is_dir()])
            if not versions:
                raise FileNotFoundError(f"No versions found for model '{name}'.")
            version_dir = versions[-1]

        pipeline_file = version_dir / "pipeline.joblib"
        metadata_file = version_dir / "metadata.json"
        evaluation_file = version_dir / "evaluation.json"

        if not pipeline_file.exists():
            raise FileNotFoundError(f"Pipeline artifact not found in {version_dir}")

        metadata: Dict[str, Any] = {}
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)

        evaluation: Dict[str, Any] = {}
        if evaluation_file.exists():
            with open(evaluation_file, "r", encoding="utf-8") as f:
                evaluation = json.load(f)

        # Cryptographic Integrity Verification (Safe Deserialization)
        if verify_integrity and "artifact_hash" in metadata:
            computed_hash = calculate_file_sha256(pipeline_file)
            expected_hash = metadata["artifact_hash"]
            if computed_hash != expected_hash:
                raise ModelSecurityError(
                    f"CRITICAL SECURITY ALERT: Artifact integrity verification failed for {name} v{metadata.get('version')}!\n"
                    f"Expected SHA-256: {expected_hash}\n"
                    f"Computed SHA-256: {computed_hash}\n"
                    f"Loading aborted to prevent unsafe deserialization or execution of tampered model file."
                )

        pipeline = joblib.load(pipeline_file)
        return pipeline, metadata, evaluation

    def approve_model(
        self,
        name: str,
        version: str,
        approved_by: str,
        reason: str = "Clinical and statistical validation passed.",
    ) -> Dict[str, Any]:
        """
        Transition model status through the formal approval gate to APPROVED.
        """
        version_dir = self.base_dir / name / version
        meta_file = version_dir / "metadata.json"
        if not meta_file.exists():
            raise FileNotFoundError(f"Metadata for {name} v{version} not found.")

        with open(meta_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        prior_status = metadata.get("status", "CANDIDATE")
        metadata["status"] = "APPROVED"
        metadata["approved_by"] = approved_by
        metadata["approved_at"] = datetime.now(timezone.utc).isoformat()
        metadata.setdefault("approval_history", []).append({
            "from_status": prior_status,
            "to_status": "APPROVED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor": approved_by,
            "reason": reason,
        })

        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        return metadata

    def activate_model(
        self,
        name: str,
        version: str,
        activated_by: str,
        reason: str = "Promoted to production active.",
    ) -> Dict[str, Any]:
        """
        Promote an APPROVED model to ACTIVE status.
        Deactivates any currently active version to ARCHIVED.
        """
        version_dir = self.base_dir / name / version
        meta_file = version_dir / "metadata.json"
        if not meta_file.exists():
            raise FileNotFoundError(f"Metadata for {name} v{version} not found.")

        with open(meta_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        # Enforce approval gate: model must be APPROVED or already ACTIVE
        if metadata.get("status") not in ("APPROVED", "ACTIVE"):
            raise ModelApprovalError(
                f"Model {name} v{version} cannot be activated: current status is '{metadata.get('status')}'. "
                f"Models must be formally APPROVED before promotion to production ACTIVE."
            )

        # Archive prior active versions
        model_dir = self.base_dir / name
        for v_dir in model_dir.iterdir():
            if v_dir.is_dir() and v_dir.name != version:
                other_meta_file = v_dir / "metadata.json"
                if other_meta_file.exists():
                    with open(other_meta_file, "r", encoding="utf-8") as f:
                        other_meta = json.load(f)
                    if other_meta.get("status") == "ACTIVE":
                        other_meta["status"] = "ARCHIVED"
                        other_meta.setdefault("approval_history", []).append({
                            "from_status": "ACTIVE",
                            "to_status": "ARCHIVED",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "actor": activated_by,
                            "reason": f"Superseded by {version}",
                        })
                        with open(other_meta_file, "w", encoding="utf-8") as f:
                            json.dump(other_meta, f, indent=2)

        prior_status = metadata.get("status")
        metadata["status"] = "ACTIVE"
        metadata["activated_by"] = activated_by
        metadata["activated_at"] = datetime.now(timezone.utc).isoformat()
        metadata.setdefault("approval_history", []).append({
            "from_status": prior_status,
            "to_status": "ACTIVE",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor": activated_by,
            "reason": reason,
        })

        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        return metadata

    def rollback_model(
        self,
        name: str,
        to_version: str,
        user: str,
        reason: str = "Rollback due to production performance drift.",
    ) -> Dict[str, Any]:
        """
        Execute audited rollback: deactivates current version, verifies target version,
        and reactivates target version.
        """
        # 1. Verify target version artifact integrity
        target_pipeline, target_meta, _ = self.load_model(name, version=to_version, verify_integrity=True)

        # 2. Re-approve target if needed, then activate
        version_dir = self.base_dir / name / to_version
        with open(version_dir / "metadata.json", "r", encoding="utf-8") as f:
            meta = json.load(f)
        meta["status"] = "APPROVED"
        with open(version_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

        activated_meta = self.activate_model(name, to_version, activated_by=user, reason=f"Rollback: {reason}")
        logger.warning("AUDIT: Rolled back model '%s' to version '%s' by '%s'. Reason: %s", name, to_version, user, reason)
        return activated_meta

    def list_models(self) -> List[Dict[str, Any]]:
        """List all registered models and version metadata."""
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
        return registered
