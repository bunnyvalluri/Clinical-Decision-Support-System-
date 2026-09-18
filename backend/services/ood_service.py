"""
Out-of-Distribution (OOD) Detection Service — BPY-CSE-2666.
Measures multivariate divergence between incoming patient data and baseline clinical training manifold.
Flags inputs as IN_DISTRIBUTION, WARNING, or OUT_OF_DISTRIBUTION.
"""
from typing import Any, Dict, List, Optional
from ml.inference.ood_detector import OODResult, OODStatus, OutOfDistributionDetector


class OODDetectionService:
    """
    Evaluates incoming clinical observation records against baseline feature distributions.
    Alerts clinicians when patient physiological measurements diverge significantly from model training data.
    """

    def __init__(self, shift_threshold: float = 3.0, ood_threshold: float = 4.5) -> None:
        self.detector = OutOfDistributionDetector(
            shift_threshold=shift_threshold,
            ood_threshold=ood_threshold,
        )

    def evaluate(self, record: Dict[str, Any]) -> OODResult:
        """
        Evaluate a single clinical record dictionary for out-of-distribution indicators.
        """
        return self.detector.evaluate_record(record)
