"""
Dataset Quality Engine.
Provides exhaustive tabular quality audits:
- Missingness rate per feature and overall dataset completeness
- Duplicate rows and patient identifier collision
- Constant, near-constant, and high-cardinality columns
- Outlier detection via IQR bounds
- Target class balance and distribution profiling
- Structured, serializable JSON report
"""
import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


class DatasetQualityEngine:
    """Production quality profiling engine for tabular datasets."""

    @classmethod
    def evaluate_dataframe(cls, df: pd.DataFrame, target_column: Optional[str] = None) -> Dict[str, Any]:
        """
        Run deep quality profiling on a pandas DataFrame.
        """
        total_rows, total_cols = df.shape
        if total_rows == 0:
            return {
                "total_rows": 0,
                "total_columns": total_cols,
                "overall_completeness": 0.0,
                "passed_quality_gate": False,
                "findings": [{"severity": "BLOCKING", "message": "Dataset contains zero rows."}],
            }

        # 1. Missingness Analysis
        missing_counts = df.isnull().sum().to_dict()
        missing_percentages = {col: round(float(cnt) / total_rows * 100.0, 2) for col, cnt in missing_counts.items()}
        total_cells = total_rows * total_cols
        total_missing = sum(missing_counts.values())
        completeness = round((1.0 - (total_missing / total_cells)) * 100.0, 2) if total_cells > 0 else 0.0

        # 2. Duplicate Detection
        duplicate_rows_count = int(df.duplicated().sum())

        # Duplicate patient IDs (if ID-like column exists)
        id_cols = [c for c in df.columns if any(k in c.lower() for k in ["patient_id", "patientid", "mrn", "subject_id", "id"])]
        id_col_findings = []
        for id_col in id_cols:
            dup_ids = int(df[id_col].duplicated().sum())
            if dup_ids > 0:
                id_col_findings.append({
                    "column": id_col,
                    "duplicate_identifiers": dup_ids,
                    "percentage": round(float(dup_ids) / total_rows * 100.0, 2),
                })

        # 3. Column Characteristics & Degenerate Columns
        constant_columns = []
        near_constant_columns = []
        high_cardinality_columns = []
        feature_stats: Dict[str, Dict[str, Any]] = {}
        findings: List[Dict[str, Any]] = []

        for col in df.columns:
            series = df[col].dropna()
            n_unique = series.nunique()

            if n_unique <= 1:
                constant_columns.append(col)
                findings.append({
                    "feature": col,
                    "severity": "WARNING",
                    "issue_type": "CONSTANT_COLUMN",
                    "message": f"Column '{col}' has only {n_unique} unique value(s).",
                })
            elif series.value_counts(normalize=True).iloc[0] > 0.99:
                near_constant_columns.append(col)
                findings.append({
                    "feature": col,
                    "severity": "INFO",
                    "issue_type": "NEAR_CONSTANT_COLUMN",
                    "message": f"Column '{col}' is >99% dominant in a single value.",
                })

            if pd.api.types.is_numeric_dtype(df[col]):
                if len(series) > 0:
                    q25 = float(series.quantile(0.25))
                    q75 = float(series.quantile(0.75))
                    iqr = q75 - q25
                    lower_bound = q25 - 1.5 * iqr
                    upper_bound = q75 + 1.5 * iqr
                    outliers_count = int(((series < lower_bound) | (series > upper_bound)).sum())

                    feature_stats[col] = {
                        "dtype": str(df[col].dtype),
                        "mean": round(float(series.mean()), 3),
                        "std": round(float(series.std()), 3) if len(series) > 1 else 0.0,
                        "median": round(float(series.median()), 3),
                        "min": round(float(series.min()), 3),
                        "max": round(float(series.max()), 3),
                        "q25": round(q25, 3),
                        "q75": round(q75, 3),
                        "iqr": round(iqr, 3),
                        "outlier_count": outliers_count,
                        "missing_count": int(missing_counts[col]),
                        "missing_pct": missing_percentages[col],
                    }
            else:
                if n_unique > 0.95 * total_rows and total_rows > 50:
                    high_cardinality_columns.append(col)
                    findings.append({
                        "feature": col,
                        "severity": "WARNING",
                        "issue_type": "HIGH_CARDINALITY",
                        "message": f"Categorical column '{col}' has high cardinality ({n_unique} unique values).",
                    })

                feature_stats[col] = {
                    "dtype": str(df[col].dtype),
                    "unique_count": n_unique,
                    "top_values": series.value_counts().head(5).to_dict(),
                    "missing_count": int(missing_counts[col]),
                    "missing_pct": missing_percentages[col],
                }

        # 4. Target Column Analysis
        target_info: Dict[str, Any] = {}
        if target_column and target_column in df.columns:
            target_series = df[target_column].dropna()
            val_counts = target_series.value_counts().to_dict()
            val_ratios = target_series.value_counts(normalize=True).to_dict()
            min_class_ratio = min(val_ratios.values()) if val_ratios else 0.0

            target_info = {
                "target_column": target_column,
                "unique_classes": list(val_counts.keys()),
                "class_counts": {str(k): int(v) for k, v in val_counts.items()},
                "class_ratios": {str(k): round(float(v), 4) for k, v in val_ratios.items()},
                "imbalance_ratio": round(1.0 / min_class_ratio, 2) if min_class_ratio > 0 else None,
                "is_imbalanced": min_class_ratio < 0.20 if len(val_ratios) > 1 else False,
            }

            if target_info.get("is_imbalanced"):
                findings.append({
                    "feature": target_column,
                    "severity": "WARNING",
                    "issue_type": "CLASS_IMBALANCE",
                    "message": f"Target column '{target_column}' is imbalanced (minority class ratio: {min_class_ratio:.1%}).",
                })

        # Add duplicate row finding if present
        if duplicate_rows_count > 0:
            findings.append({
                "feature": None,
                "severity": "WARNING",
                "issue_type": "DUPLICATE_ROWS",
                "message": f"Detected {duplicate_rows_count} exact duplicate rows ({round(duplicate_rows_count/total_rows*100, 2)}%).",
            })

        # High missingness features
        for col, pct in missing_percentages.items():
            if pct > 40.0:
                findings.append({
                    "feature": col,
                    "severity": "ERROR" if pct > 75.0 else "WARNING",
                    "issue_type": "HIGH_MISSINGNESS",
                    "message": f"Feature '{col}' has {pct}% missing values.",
                })

        # Overall quality gate
        has_blocking = any(f["severity"] == "BLOCKING" for f in findings)
        error_count = sum(1 for f in findings if f["severity"] == "ERROR")
        passed_quality_gate = not has_blocking and (error_count == 0) and (completeness >= 60.0)

        return {
            "total_rows": total_rows,
            "total_columns": total_cols,
            "overall_completeness": completeness,
            "duplicate_rows": duplicate_rows_count,
            "duplicate_id_columns": id_col_findings,
            "constant_columns": constant_columns,
            "near_constant_columns": near_constant_columns,
            "high_cardinality_columns": high_cardinality_columns,
            "missing_percentages": missing_percentages,
            "target_analysis": target_info,
            "feature_statistics": feature_stats,
            "findings": findings,
            "passed_quality_gate": passed_quality_gate,
            "integrity_score": round(max(0.0, completeness - (duplicate_rows_count / total_rows * 50.0)), 2),
        }
