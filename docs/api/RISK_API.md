# Clinical Risk & CDSS REST & WebSocket API Specification — BPY-CSE-2666

## Base URLs
- REST API: `https://<domain>/api/v1/risk/`
- WebSocket Endpoint: `wss://<domain>/ws/dashboard/`

---

## REST Endpoints

### 1. Execute Real-Time Risk Prediction
- **Endpoint**: `POST /api/v1/risk/predictions/`
- **Permissions**: Authenticated Clinician (`DOCTOR`, `CLINICIAN`, `ADMIN`)
- **Request Body**:
```json
{
  "patient_id": "8a7b9c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
  "model_name": "random_forest_risk_model",
  "vitals": {
    "age": 68,
    "gender": "MALE",
    "systolic_bp": 145,
    "diastolic_bp": 92,
    "heart_rate": 88,
    "respiratory_rate": 22,
    "body_temperature": 38.3,
    "oxygen_saturation": 93.0,
    "bmi": 27.4,
    "glucose_level": 135.0,
    "gcs": 15
  },
  "trigger": "ADMISSION"
}
```
- **Response (201 Created)**:
```json
{
  "id": "e4f3a2b1-0c9d-8e7f-6a5b-4c3d2e1f0a9b",
  "patient_id": "8a7b9c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
  "risk_level": "HIGH",
  "probability": 0.8845,
  "confidence_score": 0.92,
  "uncertainty_score": 0.08,
  "is_abstaining": false,
  "ood_status": "IN-DISTRIBUTION",
  "model_name": "Random Forest Risk Classifier",
  "model_version": "1.0.0",
  "inference_latency_ms": 1.45,
  "timestamp": "2026-09-18T06:50:00Z",
  "cdss_guidance": {
    "risk_level": "HIGH",
    "confidence_level": "HIGH",
    "suggested_clinical_review": "REQUIRED",
    "clinical_summary": "Patient identified in elevated risk tier. Attending physician review and risk verification required. Clinical Flag: qSOFA (Respiratory rate >= 22 breaths/min).",
    "deterministic_alerts": [
      {
        "rule_name": "qSOFA Screening: Tachypnea",
        "severity": "WARNING",
        "trigger_criteria": "respiratory_rate >= 22",
        "recommended_action": "Evaluate for developing sepsis."
      }
    ],
    "top_contributing_factors": [
      {
        "feature_name": "respiratory_rate",
        "attribution_value": 0.28,
        "clinical_direction": "RISK_INCREASING"
      },
      {
        "feature_name": "oxygen_saturation",
        "attribution_value": 0.22,
        "clinical_direction": "RISK_INCREASING"
      }
    ],
    "safety_disclaimer": "HealthNova AI provides advisory clinical decision support only..."
  }
}
```

### 2. List Trained Models & Real Evaluations
- **Endpoint**: `GET /api/v1/risk/models/`
- **Response (200 OK)**:
```json
{
  "models": [
    {
      "id": "...",
      "model_name": "random_forest_risk_model",
      "version": "1.0.0",
      "algorithm": "Random Forest",
      "status": "ACTIVE",
      "accuracy": "1.0000",
      "is_champion": true,
      "metrics": {
        "accuracy": 1.0,
        "roc_auc": 1.0,
        "f1_score": 1.0,
        "precision": 1.0,
        "recall": 1.0
      }
    },
    {
      "id": "...",
      "model_name": "svm_risk_model",
      "version": "1.0.0",
      "algorithm": "Support Vector Machine (SVM)",
      "status": "CANDIDATE",
      "accuracy": "0.9950",
      "is_champion": false,
      "metrics": {
        "accuracy": 0.995,
        "roc_auc": 0.9995,
        "f1_score": 0.995,
        "precision": 0.995,
        "recall": 0.995
      }
    }
  ]
}
```

### 3. Record Clinician Override & Audit
- **Endpoint**: `POST /api/v1/risk/predictions/{id}/override/`
- **Request Body**:
```json
{
  "clinician_override": "HIGH",
  "override_reason": "Patient is clinically diaphoretic with borderline oxygenation."
}
```
- **Response (200 OK)**:
```json
{
  "id": "...",
  "prediction_result": "HIGH",
  "clinician_override": "HIGH",
  "override_reason": "Patient is clinically diaphoretic with borderline oxygenation.",
  "overridden_by": "Dr. Arthur Collins",
  "override_timestamp": "2026-09-18T06:51:00Z"
}
```

### 4. Patient Longitudinal Risk Profile
- **Endpoint**: `GET /api/v1/patients/{patient_id}/risk/`
- **Response (200 OK)**: Returns latest prediction, CDSS guidance, 7-day vitals timeline, and full risk trajectory.

---

## WebSocket Events (Channel: `dashboard`)

| Event Type | Description | Sample Payload Keys |
|---|---|---|
| `risk_prediction_completed` | Broadcast upon real-time inference completion | `type`, `prediction_id`, `patient_id`, `risk_level`, `probability`, `model_name` |
| `risk_prediction_abstained` | Emitted when model uncertainty triggers abstention | `type`, `prediction_id`, `patient_id`, `uncertainty_score`, `reason` |
| `risk_model_activated` | Emitted when a candidate model is promoted to champion | `type`, `model_name`, `version`, `activated_by`, `timestamp` |
