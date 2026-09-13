# Backend Service Layer

The Service Layer acts as an intermediary between REST views and data access layers, encapsulating all business logic, transactions, and event dispatches.

---

## 1. Service Catalog

### 1.1 `PredictionService` (`services/prediction_service.py`)
- Coordinates real-time risk predictions for a patient.
- Fetches recent encounter vitals through `DjangoPredictionRepository`.
- Executes model inference via `ModelLoaderService`.
- Extracts SHAP factor attributions via `ExplanationService`.
- Persists results atomically in PostgreSQL.
- Publishes real-time prediction and emergency alert events to Redis channel layers.
- Records physician overrides with mandatory textual justifications.

### 1.2 `ExplanationService` (`services/explanation_service.py`)
- Formats TreeSHAP values into clinical risk factors.
- Generates natural language explanations (e.g., *"Elevated systolic blood pressure (172 mmHg) increases cardiovascular risk"*).
- Attaches the standard institutional clinical disclaimer.

### 1.3 `ModelLoaderService` (`services/model_loader.py`)
- Manages an in-memory thread-safe singleton cache of the active scikit-learn model pipeline.
- Provides sub-millisecond model retrieval for runtime inference.
- Exposes `invalidate_cache()` to reload models when a new version is promoted.
