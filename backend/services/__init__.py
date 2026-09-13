"""
Services package.

Business logic lives here, NOT in views or models.
Each service class handles a specific domain area and coordinates between
the repository layer and external/ML systems.
"""
from services.base import BaseService
from services.feature_preprocessor import (
    FeaturePreprocessor,
    FeatureValidationError,
    InvalidFeatureRangeError,
    MissingFeatureError,
)
from services.model_loader import (
    InvalidArtifactError,
    ModelLoaderError,
    ModelLoaderService,
    NoActiveModelError,
)
from services.model_provider import (
    IModelProvider,
    ModelUnavailableError,
    RegistryModelProvider,
)
from services.prediction_result import ExplanationResult, PredictionResult
from services.prediction_service import (
    MissingClinicalDataError,
    PatientNotFoundError,
    PredictionService,
    PredictionServiceError,
)
from services.risk_engine import RiskPredictionEngine

__all__ = [
    "BaseService",
    "ModelLoaderService",
    "ModelLoaderError",
    "NoActiveModelError",
    "InvalidArtifactError",
    "IModelProvider",
    "RegistryModelProvider",
    "ModelUnavailableError",
    "FeaturePreprocessor",
    "FeatureValidationError",
    "MissingFeatureError",
    "InvalidFeatureRangeError",
    "PredictionResult",
    "ExplanationResult",
    "RiskPredictionEngine",
    "PredictionService",
    "PredictionServiceError",
    "MissingClinicalDataError",
    "PatientNotFoundError",
]
