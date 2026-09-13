"""
Data loader and group-aware splitting module.
Ensures rigorous train/val/test separation with patient-level group isolation,
stratification, and zero data leakage.
"""
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit, train_test_split

from ml.data.dataset import get_or_create_dataset
from ml.features.schema import FEATURE_NAMES, TARGET_COLUMN

logger = logging.getLogger(__name__)


def audit_leakage(
    train_groups: Optional[pd.Series],
    test_groups: Optional[pd.Series],
    val_groups: Optional[pd.Series] = None,
) -> Dict[str, Any]:
    """
    Audit split partitions for patient-level group overlap leakage.
    """
    results: Dict[str, Any] = {"leakage_detected": False, "overlap_counts": {}}

    if train_groups is None or test_groups is None:
        return results

    train_set = set(train_groups.dropna().unique())
    test_set = set(test_groups.dropna().unique())
    train_test_overlap = train_set & test_set

    if train_test_overlap:
        results["leakage_detected"] = True
        results["overlap_counts"]["train_test"] = len(train_test_overlap)
        logger.error("DATA LEAKAGE: %d patients overlap between Train and Test!", len(train_test_overlap))

    if val_groups is not None:
        val_set = set(val_groups.dropna().unique())
        train_val_overlap = train_set & val_set
        val_test_overlap = val_set & test_set
        if train_val_overlap:
            results["leakage_detected"] = True
            results["overlap_counts"]["train_val"] = len(train_val_overlap)
        if val_test_overlap:
            results["leakage_detected"] = True
            results["overlap_counts"]["val_test"] = len(val_test_overlap)

    return results


def load_and_split_data(
    data_path: str | Path | None = None,
    test_size: float = 0.20,
    val_size: float = 0.0,
    group_col: str = "patient_id",
    random_state: int = 42,
    return_validation: bool = False,
) -> Union[
    Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series],
    Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series],
]:
    """
    Load patient clinical observations, extract features and target, and split
    into partitions while preventing patient-level data leakage.

    When `patient_id` column is available, performs Group-Aware Splitting (GroupShuffleSplit)
    so all encounters for a given patient are strictly confined to a single partition.
    When `return_validation=True`, returns 3-way partition: (X_train, X_val, X_test, y_train, y_val, y_test).
    When `return_validation=False`, returns 2-way partition: (X_train, X_test, y_train, y_test) for backward compatibility.
    """
    if data_path:
        path = Path(data_path)
        if not path.exists():
            raise FileNotFoundError(f"Specified dataset file does not exist: {path}")
        df = pd.read_csv(path)
    else:
        df = get_or_create_dataset()

    # Validate target column exists
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not present in dataset.")

    # Ensure all feature columns exist in DataFrame
    for col in FEATURE_NAMES:
        if col not in df.columns:
            raise ValueError(f"Required feature column '{col}' missing from dataset.")

    X = df[FEATURE_NAMES].copy()
    y = df[TARGET_COLUMN].copy()
    has_groups = group_col in df.columns

    if has_groups:
        groups = df[group_col]
        gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
        train_idx, test_idx = next(gss.split(X, y, groups=groups))

        X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
        y_train, y_test = y.iloc[train_idx].copy(), y.iloc[test_idx].copy()
        train_groups = groups.iloc[train_idx]
        test_groups = groups.iloc[test_idx]

        if return_validation and val_size > 0.0:
            # Adjust relative val_size from remaining train split
            relative_val_size = val_size / (1.0 - test_size)
            gss_val = GroupShuffleSplit(n_splits=1, test_size=relative_val_size, random_state=random_state)
            sub_train_idx, val_idx = next(gss_val.split(X_train, y_train, groups=train_groups))

            X_val = X_train.iloc[val_idx].copy()
            y_val = y_train.iloc[val_idx].copy()
            val_groups = train_groups.iloc[val_idx]

            X_train = X_train.iloc[sub_train_idx].copy()
            y_train = y_train.iloc[sub_train_idx].copy()
            train_groups = train_groups.iloc[sub_train_idx]

            audit = audit_leakage(train_groups, test_groups, val_groups)
            if audit["leakage_detected"]:
                raise RuntimeError(f"Group leakage detected in 3-way split: {audit}")

            return X_train, X_val, X_test, y_train, y_val, y_test

        audit = audit_leakage(train_groups, test_groups)
        if audit["leakage_detected"]:
            raise RuntimeError(f"Group leakage detected in 2-way split: {audit}")

        return X_train, X_test, y_train, y_test

    # Fallback to stratified split if no group column is present
    if return_validation and val_size > 0.0:
        # First split off test set
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, stratify=y, random_state=random_state
        )
        # Next split temp into train and val
        relative_val_size = val_size / (1.0 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=relative_val_size, stratify=y_temp, random_state=random_state
        )
        return X_train, X_val, X_test, y_train, y_val, y_test

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )
    return X_train, X_test, y_train, y_test
