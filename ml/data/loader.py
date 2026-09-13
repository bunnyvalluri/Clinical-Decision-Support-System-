"""
Data loader and splitting module.
Ensures rigorous train/test separation with stratification and zero data leakage.
"""
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

from ml.data.dataset import get_or_create_dataset
from ml.features.schema import FEATURE_NAMES, TARGET_COLUMN


def load_and_split_data(
    data_path: str | Path | None = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Load patient clinical observations, extract features and target, and split
    into stratified train and test partitions to prevent data leakage.
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

    X = df[FEATURE_NAMES]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        stratify=y,
        random_state=random_state,
    )

    return X_train, X_test, y_train, y_test
