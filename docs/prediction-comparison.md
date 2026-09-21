# Current vs. Previous Prediction Comparison Specification

## Purpose & Clinical Significance
Patients in clinical settings frequently undergo multiple diagnostic and telemetry assessments over time. A single isolated ML prediction lacks temporal context. HealthNova AI's **Prediction Comparison Engine** (`PredictionComparisonService`) calculates:
1. **Risk Tier Transitions**: Quantifying whether patient risk escalated, remained stable, or improved.
2. **Physiological Feature Deltas**: Calculating absolute deltas and percentage changes in biomarkers (e.g. SBP, HR, SpO2, glucose, lactate).
3. **Clinical Significance Classification**: Classifying feature deltas as `HIGH`, `MEDIUM`, or `LOW` based on deterministic physiological thresholds.
4. **TreeSHAP Attribution Divergence**: Identifying which specific biomarker shifts drove the change in model decision boundary.
5. **Automated Escalation Triggers**: Raising proactive alerts when a patient transitions from `LOW` or `MEDIUM` to `HIGH` or `CRITICAL`.

---

## Physiological Significance Rules

The comparison engine evaluates feature changes against established clinical guidelines:
- **Systolic BP**: Absolute shift $> 20$ mmHg $\rightarrow$ `HIGH`; $> 10$ mmHg $\rightarrow$ `MEDIUM`.
- **Heart Rate**: Absolute shift $> 20$ bpm $\rightarrow$ `HIGH`; $> 10$ bpm $\rightarrow$ `MEDIUM`.
- **SpO2**: Absolute shift $> 4\%$ drop $\rightarrow$ `HIGH`; $> 2\%$ $\rightarrow$ `MEDIUM`.
- **Serum Lactate**: Absolute shift $> 1.0$ mmol/L $\rightarrow$ `HIGH`; $> 0.5$ mmol/L $\rightarrow$ `MEDIUM`.
- **Serum Creatinine**: Absolute shift $> 0.3$ mg/dL (KDIGO Acute Kidney Injury threshold) $\rightarrow$ `HIGH`.

---

## Data Structure (API Response Schema)

```json
{
  "has_comparison": true,
  "elapsed_seconds": 259200,
  "elapsed_human": "3d 0h",
  "current_prediction": {
    "prediction_id": "c6a2b8e4-...",
    "risk_level": "HIGH",
    "probability": 0.785,
    "confidence_score": 0.92,
    "model_name": "HeartFailure-XGB",
    "model_version": "2.1.0",
    "timestamp": "2026-09-21T14:30:00Z"
  },
  "previous_prediction": {
    "prediction_id": "a1b2c3d4-...",
    "risk_level": "LOW",
    "probability": 0.185,
    "confidence_score": 0.89,
    "model_name": "HeartFailure-XGB",
    "model_version": "2.1.0",
    "timestamp": "2026-09-18T14:30:00Z"
  },
  "risk_transition": {
    "previous_risk": "LOW",
    "current_risk": "HIGH",
    "tier_delta": 2,
    "is_escalation": true,
    "transition_label": "ESCALATION_HIGH"
  },
  "feature_differences": [
    {
      "feature": "systolic_bp",
      "previous_value": 120.0,
      "current_value": 168.0,
      "delta": 48.0,
      "percentage_change": 40.0,
      "clinical_significance": "HIGH",
      "direction": "INCREASED"
    }
  ],
  "shap_divergence": [
    {
      "feature": "systolic_bp",
      "previous_importance": 0.05,
      "current_importance": 0.38,
      "importance_delta": 0.33,
      "direction_changed": false
    }
  ]
}
```

---

## API Endpoints

- `GET /api/v1/predictions/{id}/comparison/`: Compares prediction with its immediately preceding historical assessment.
- `GET /api/v1/patients/{id}/predictions/comparison/`: Compares the patient's latest prediction with the second most recent.
