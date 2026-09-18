"""
Kaggle Dataset Version Tracking and Difference Engine.
Detects upstream version changes, schema mutations, row count shifts, and distribution drift.
"""
import logging
from typing import Any, Dict, List, Optional
import pandas as pd

from integrations.kaggle.client import KaggleClient
from integrations.kaggle.schemas import DatasetVersionDiffDTO

logger = logging.getLogger("integrations.kaggle.version_service")


class KaggleVersionService:
    """Manages version comparison, schema diffing, and migration checks."""

    def __init__(self, client: Optional[KaggleClient] = None) -> None:
        self.client = client or KaggleClient()

    @staticmethod
    def compare_versions(
        old_df_path: Optional[str],
        new_df_path: str,
        prior_version: str,
        new_version: str,
        dataset_slug: str,
    ) -> DatasetVersionDiffDTO:
        """
        Compare two versioned CSV snapshots to detect schema deltas and distribution changes.
        """
        new_df = pd.read_csv(new_df_path)
        new_cols = list(new_df.columns)
        new_rows = len(new_df)

        if not old_df_path:
            return DatasetVersionDiffDTO(
                dataset_slug=dataset_slug,
                prior_version="None",
                new_version=new_version,
                row_count_delta=new_rows,
                column_count_delta=len(new_cols),
                added_columns=new_cols,
                removed_columns=[],
                schema_changed=True,
                distribution_shift_detected=False,
                diff_summary=f"Initial ingestion of v{new_version} with {new_rows} rows and {len(new_cols)} columns.",
            )

        old_df = pd.read_csv(old_df_path)
        old_cols = list(old_df.columns)
        old_rows = len(old_df)

        added = [c for c in new_cols if c not in old_cols]
        removed = [c for c in old_cols if c not in new_cols]
        schema_changed = bool(added or removed)

        row_delta = new_rows - old_rows
        col_delta = len(new_cols) - len(old_cols)

        # Check distribution shifts on common numerical columns
        shift_detected = False
        common_numeric = [
            c for c in new_cols
            if c in old_cols and pd.api.types.is_numeric_dtype(new_df[c]) and pd.api.types.is_numeric_dtype(old_df[c])
        ]

        for col in common_numeric[:5]:
            old_mean = old_df[col].mean()
            new_mean = new_df[col].mean()
            if old_mean and abs(new_mean - old_mean) / (abs(old_mean) + 1e-5) > 0.25:
                shift_detected = True
                break

        summary = (
            f"Version update {prior_version} -> {new_version}: "
            f"Row count delta: {row_delta:+d} ({old_rows} -> {new_rows}). "
            f"Columns delta: {col_delta:+d}. "
            f"Schema changed: {schema_changed}."
        )

        return DatasetVersionDiffDTO(
            dataset_slug=dataset_slug,
            prior_version=prior_version,
            new_version=new_version,
            row_count_delta=row_delta,
            column_count_delta=col_delta,
            added_columns=added,
            removed_columns=removed,
            schema_changed=schema_changed,
            distribution_shift_detected=shift_detected,
            diff_summary=summary,
        )
