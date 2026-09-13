# Predictions API

Endpoints for real-time machine learning inference, explainability, batch predictions, and clinical overrides.

---

## 1. Endpoints

### 1.1 `POST /api/v1/predictions/`
Request real-time clinical risk inference for a patient encounter.
- **Request Body:**
  ```json
  {
    "patient_id": "3500a9c4-dd95-48c2-af3b-7913285b9158"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "c67c29de-dc33-48d4-8632-d13955d24ea4",
    "patient": "3500a9c4-dd95-48c2-af3b-7913285b9158",
    "prediction_result": "HIGH",
    "probability": 0.8420,
    "confidence_score": 0.8420,
    "inference_latency_ms": 1.45,
    "explanation": {
      "baseline_value": 0.248,
      "features": [
        {
          "feature": "systolic_bp",
          "attribution": 0.182,
          "direction": "INCREASES_RISK",
          "clinical_description": "Elevated systolic blood pressure (172 mmHg) increases cardiovascular risk."
        }
      ],
      "disclaimer": "This is a MODEL EXPLANATION, not a medical diagnosis."
    }
  }
  ```

### 1.2 `GET /api/v1/predictions/{id}/explanation/`
Retrieve detailed SHAP factor waterfall for an existing prediction.

### 1.3 `POST /api/v1/predictions/{id}/override/`
Record an attending physician's clinical override of the automated risk level.
- **Request Body:**
  ```json
  {
    "clinician_override": "CRITICAL",
    "override_reason": "Patient shows refractory tachypnea and impending hemodynamic collapse."
  }
  ```

### 1.4 `POST /api/v1/predictions/batch/`
Submit a vectorized array of observations for high-throughput batch evaluation.
