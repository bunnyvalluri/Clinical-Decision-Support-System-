"""
Lightweight Structured Experiment Tracker.
Persists structured records of training experiments without requiring heavy external dependencies.
Tracks:
- Experiment ID & run name
- Model algorithm & hyperparameters
- Dataset identifier, version, and record counts
- Complete evaluation metrics (accuracy, F1, ROC-AUC, PR-AUC, Brier score)
- Artifact pointers and cryptographic SHA-256 hashes
- Environmental metadata (Python version, random seed, timestamp)
"""
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import platform
import sys
from typing import Any, Dict, List, Optional
import uuid

logger = logging.getLogger(__name__)

EXPERIMENTS_DIR = Path(__file__).resolve().parent.parent / "artifacts" / "experiments"


class ExperimentTracker:
    """
    Lightweight JSON-based experiment tracking store.
    """

    def __init__(self, base_dir: Optional[Path] = None) -> None:
        self.base_dir = base_dir or EXPERIMENTS_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.runs_file = self.base_dir / "experiment_runs.jsonl"

    def log_experiment(
        self,
        model_name: str,
        algorithm: str,
        hyperparameters: Dict[str, Any],
        dataset_name: str,
        dataset_version: str,
        metrics: Dict[str, Any],
        artifact_path: Optional[str] = None,
        artifact_hash: Optional[str] = None,
        experiment_id: Optional[str] = None,
        notes: str = "",
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Record a completed training/evaluation experiment run.
        """
        exp_id = experiment_id or f"EXP-{uuid.uuid4().hex[:8].upper()}"
        run_record = {
            "experiment_id": exp_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model_name": model_name,
            "algorithm": algorithm,
            "hyperparameters": hyperparameters,
            "dataset": {
                "name": dataset_name,
                "version": dataset_version,
            },
            "metrics": {
                "accuracy": metrics.get("accuracy"),
                "f1_macro": metrics.get("f1_macro"),
                "f1_weighted": metrics.get("f1_weighted"),
                "roc_auc_macro": metrics.get("roc_auc_macro") or metrics.get("roc_auc"),
                "pr_auc_macro": metrics.get("pr_auc_macro"),
                "brier_score": metrics.get("brier_score"),
                "latency_per_sample_ms": metrics.get("latency_per_sample_ms"),
            },
            "artifact": {
                "path": str(artifact_path) if artifact_path else None,
                "sha256": artifact_hash,
            },
            "environment": {
                "python_version": platform.python_version(),
                "system": platform.system(),
            },
            "notes": notes,
            "tags": tags or [],
        }

        # Append to JSONL registry
        with open(self.runs_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(run_record) + "\n")

        logger.info("Logged experiment %s for %s (%s)", exp_id, model_name, algorithm)
        return run_record

    def list_experiments(
        self,
        model_name: Optional[str] = None,
        min_f1: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve and filter historical experiment runs."""
        runs: List[Dict[str, Any]] = []
        if not self.runs_file.exists():
            return runs

        with open(self.runs_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        record = json.loads(line)
                        if model_name and record.get("model_name") != model_name:
                            continue
                        if min_f1 and (record.get("metrics", {}).get("f1_macro") or 0.0) < min_f1:
                            continue
                        runs.append(record)
                    except json.JSONDecodeError:
                        continue
        return runs
