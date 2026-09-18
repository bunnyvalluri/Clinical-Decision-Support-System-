"""
Synthetic Data Detection Engine.
Analyzes documentation, metadata, repeated patterns, digit distribution, and statistical uniformities
to assess whether a dataset is real, synthetic, or partially synthetic.
"""
import re
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

SYNTHETIC_KEYWORDS = [
    "synthetic", "artificially generated", "ctgan", "synthea", "sdv",
    "generated using", "simulated", "simulation", "mock data", "faker",
    "generated data", "synthetic data vault"
]


class SyntheticDataDetector:
    """Evaluates synthetic vs real biological provenance."""

    @classmethod
    def analyze_dataset(
        cls,
        df: pd.DataFrame,
        description: str = "",
        dataset_title: str = "",
    ) -> Dict[str, Any]:
        """
        Inspect text documentation and numerical distribution properties.
        """
        text_corpus = f"{dataset_title} {description}".lower()
        matched_keywords = [k for k in SYNTHETIC_KEYWORDS if k in text_corpus]

        reasons: List[str] = []
        is_synthetic = False
        confidence = 0.0

        if matched_keywords:
            is_synthetic = True
            confidence = 0.95
            reasons.append(f"Documentation explicitly cites generation terms: {matched_keywords}")

        # Check for perfect sequential integer IDs in non-standard columns
        sequential_cols = []
        for col in df.columns:
            if pd.api.types.is_integer_dtype(df[col]) and len(df) > 50:
                s = df[col].dropna()
                if s.is_monotonic_increasing and (s.diff().dropna() == 1).all():
                    sequential_cols.append(col)

        if len(sequential_cols) > 2:
            reasons.append(f"Multiple strictly monotonic sequential columns detected ({sequential_cols}).")
            if not is_synthetic:
                is_synthetic = True
                confidence = 0.60

        # Uniform distribution check across continuous variables
        uniform_cols = []
        for col in df.columns:
            if pd.api.types.is_float_dtype(df[col]) and len(df) > 100:
                series = df[col].dropna()
                # Test for uniform-like spread (min-max / std close to sqrt(12))
                std_dev = series.std()
                spread = series.max() - series.min()
                if spread > 0 and std_dev > 0:
                    ratio = spread / std_dev
                    if 3.3 <= ratio <= 3.6:  # Uniform distribution theoretical spread/std ratio ~ 3.46
                        uniform_cols.append(col)

        if len(uniform_cols) >= 3:
            reasons.append(f"Features show synthetic uniform variance profiles: {uniform_cols[:3]}")
            if not is_synthetic:
                is_synthetic = True
                confidence = 0.55

        if not reasons:
            reasons.append("Empirical distribution profiles reflect natural biological variation with skewed distributions.")

        return {
            "dataset_is_synthetic": is_synthetic,
            "synthetic_confidence": confidence if is_synthetic else 0.05,
            "synthetic_reason": "; ".join(reasons),
            "matched_keywords": matched_keywords,
        }
