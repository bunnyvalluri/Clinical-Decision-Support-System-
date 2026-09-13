"""
Clinical Model Benchmarking and Comparison Runner.
Trains, calibrates, and evaluates SVM, Random Forest, and AdaBoost on identical held-out test splits.
Produces a reproducible, scientifically defensible comparison table across discrimination,
calibration (Brier score), sensitivity/specificity, latency, and artifact size.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List
import pandas as pd

from ml.data.dataset import get_or_create_dataset
from ml.data.loader import load_and_split_data
from ml.evaluation.evaluator import evaluate_model
from ml.registry.model_registry import ModelRegistry
from ml.training.train import train_and_evaluate_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BENCHMARKS_DIR = Path(__file__).resolve().parent.parent / "artifacts" / "benchmarks"


def run_model_benchmark() -> Dict[str, Any]:
    """
    Train and benchmark SVM, Random Forest, and AdaBoost.
    """
    BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
    registry = ModelRegistry()

    models_to_test = [
        ("SVM", {"kernel": "rbf", "C": 1.0, "class_weight": "balanced", "random_state": 42}),
        ("RANDOM_FOREST", {"n_estimators": 100, "max_depth": 12, "class_weight": "balanced", "random_state": 42}),
        ("ADABOOST", {"n_estimators": 100, "learning_rate": 0.8, "random_state": 42}),
    ]

    results: Dict[str, Any] = {}
    table_rows: List[Dict[str, Any]] = []

    for model_type, hyperparams in models_to_test:
        logger.info("Benchmarking %s...", model_type)
        eval_run = train_and_evaluate_model(
            model_type=model_type,
            version="1.0.0",
            hyperparameters=hyperparams,
            registry=registry,
            calibrate=True,
            status="VALIDATED",
        )
        metrics = eval_run["metrics"]
        results[model_type] = eval_run

        c_err = metrics.get("clinical_error_impact", {})
        table_rows.append({
            "Model": model_type,
            "Accuracy": metrics.get("accuracy"),
            "Precision (Macro)": metrics.get("precision_macro"),
            "Recall (Macro)": metrics.get("recall_macro"),
            "F1-Score (Macro)": metrics.get("f1_macro"),
            "ROC-AUC (OvR)": metrics.get("roc_auc_macro"),
            "PR-AUC (OvR)": metrics.get("pr_auc_macro"),
            "Brier Score": metrics.get("brier_score"),
            "Missed High/Crit": c_err.get("missed_high_risk_cases", 0) + c_err.get("missed_critical_cases", 0),
            "Latency (ms/sample)": metrics.get("latency_per_sample_ms"),
            "Model Size (KB)": metrics.get("model_size_kb"),
        })

    # Save full benchmark JSON
    benchmark_file = BENCHMARKS_DIR / "model_comparison.json"
    with open(benchmark_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Save Markdown table
    df_table = pd.DataFrame(table_rows)
    headers = list(df_table.columns)
    header_row = "| " + " | ".join(headers) + " |"
    separator_row = "| " + " | ".join(["---"] * len(headers)) + " |"
    data_rows = []
    for _, row in df_table.iterrows():
        data_rows.append("| " + " | ".join(str(row[h]) for h in headers) + " |")
    md_table = "\n".join([header_row, separator_row] + data_rows)

    with open(BENCHMARKS_DIR / "benchmark_summary.md", "w", encoding="utf-8") as f:
        f.write("# Clinical ML Model Benchmark Comparison\n\n")
        f.write(md_table + "\n\n")
        f.write("*Note: All metrics calculated on identical held-out test partition with zero patient leakage.*\n")

    logger.info("Benchmarking complete. Results saved to %s", BENCHMARKS_DIR)
    return {
        "results": results,
        "table": df_table.to_dict(orient="records"),
        "markdown_table": md_table,
    }



if __name__ == "__main__":
    run_model_benchmark()
