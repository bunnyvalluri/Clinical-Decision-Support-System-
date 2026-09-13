"""
Reproducible preprocessing pipeline using scikit-learn.
Handles imputation, scaling, and categorical one-hot encoding through ColumnTransformer.
"""
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from ml.features.schema import CATEGORICAL_FEATURES, NUMERICAL_FEATURES


def build_preprocessing_pipeline() -> ColumnTransformer:
    """
    Construct a scikit-learn ColumnTransformer for preprocessing patient observations.

    - Numerical features: Median imputation followed by standard scaling.
    - Categorical features: Constant imputation ('UNKNOWN') followed by one-hot encoding
      with handle_unknown='ignore' to prevent crashes on novel test categories.
    """
    numerical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_transformer, NUMERICAL_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    return preprocessor
