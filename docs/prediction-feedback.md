# Prediction Feedback Loop & Monitoring Specification

## Governance Principle: No Automated Retraining
In clinical safety environments, autonomous model retraining on unvetted real-world feedback is strictly prohibited to prevent catastrophic forgetting, data poisoning, and distribution drift.
All clinician feedback is ingested into `PredictionFeedback` solely for:
1. **Model Monitoring & Observability**: Informaticist drift dashboards and quality metric audits.
2. **Candidate Dataset Curation**: Human-in-the-loop review by clinical ML engineers prior to versioned offline retraining.
3. **Clinical Governance Reviews**: Quarterly AI Safety Committee evaluations.

---

## Feedback Categories

Defined in `apps.predictions.models.FeedbackCategory`:
- `PREDICTION_ACCEPTED`: Prediction was clinically useful and matched findings.
- `NOT_CLINICALLY_USEFUL`: Prediction was technically accurate but did not alter care plan.
- `INCORRECT_PREDICTION`: Model misestimated risk level based on clinical gold standard.
- `INSUFFICIENT_DATA`: Missing key biomarkers or inadequate vital history for inference.
- `CONFLICTING_INFORMATION`: Conflicting telemetry or EHR data produced anomalous output.
- `NEEDS_REVIEW`: High ambiguity warranting multi-disciplinary team review.
- `OTHER`: Unspecified clinical note.

---

## API Endpoints

### Submit Feedback
`POST /api/v1/predictions/{id}/feedback/`

**Request Body:**
```json
{
  "category": "PREDICTION_ACCEPTED",
  "is_helpful": true,
  "clinician_notes": "Prompt detection of early ischemic pattern enabled timely heparin initiation."
}
```

### List Feedback for Prediction
`GET /api/v1/predictions/{id}/feedback/`
