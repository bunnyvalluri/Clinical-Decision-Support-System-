# End-to-End AI Workflow & Orchestration Lifecycle

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Typical Clinician Evaluation Workflow

```
[Doctor in /doctor/ai-assistant]
         │
         ▼  (POST /api/v1/ai/orchestrator/evaluate/)
[Django REST API] ──(Validates JWT & Doctor Role)──> [SafetyGuardrailService]
                                                              │ (Passed)
                                                              ▼
                                                   [ClinicalRiskContextBuilder]
                                                              │ (Builds minimal context)
                                                              ▼
                                                   [Ruflo Swarm Coordinator]
                                                              │
                    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                    ▼                                         ▼                                         ▼
         [Deterministic Rules Engine]                [ML Engine (Scikit-Learn)]               [Knowledge Retrieval]
         (Evaluates qSOFA & NEWS2)                   (Ensemble Risk & TreeSHAP)               (KDIGO / SSC Citations)
                    │                                         │                                         │
                    └─────────────────────────────────────────┼─────────────────────────────────────────┘
                                                              ▼
                                                  [Uncertainty Engine]
                                                  (Entropy & OOD Analysis)
                                                              │
                                                              ▼
                                                  [Clinical Safety Agent]
                                                  (Emits SAFE / REVIEW_REQUIRED)
                                                              │
                                                              ▼
                                                  [Human Approval Gate]
                                                  (Mandates Doctor Sign-off)
                                                              │
                                                              ▼
                                                  [Audit Logger & Trace Ledger]
                                                              │
                                                              ▼
                                                  [Django Channels WebSocket]
                                                  (Emits AI_RESPONSE_READY)
```

---

## 2. Structured Output Schema

All AI outputs conform to strongly-typed JSON responses:

```json
{
  "correlation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "patient_mrn": "MRN-10492",
  "timestamp": "2026-09-15T15:30:00Z",
  "status": "COMPLETED",
  "requires_human_review": true,
  "safety_verdict": "REVIEW_REQUIRED",
  "deterministic_rules": [
    {
      "rule_name": "qSOFA Score",
      "severity": "URGENT_EVALUATION",
      "trigger_criteria": "Respiratory rate >= 22 (recorded 24)"
    }
  ],
  "ml_prediction": {
    "risk_level": "HIGH",
    "probability": 0.842,
    "model_name": "RandomForest_Calibrated_v2",
    "model_version": "2.4.1"
  },
  "uncertainty": {
    "confidence_score": 0.81,
    "entropy": 0.42,
    "should_abstain": false
  },
  "shap_explanation": {
    "top_features": [
      {"feature": "lactic_acid", "value": 3.2, "impact": "+0.31"},
      {"feature": "respiratory_rate", "value": 24, "impact": "+0.22"}
    ]
  },
  "guideline_citations": [
    {
      "guideline_id": "SSC-2021-01",
      "title": "Surviving Sepsis Campaign Guidelines 2021",
      "recommendation": "Serum lactate >2.0 mmol/L warrants immediate evaluation."
    }
  ],
  "clinical_summary": "Patient demonstrates elevated risk markers. Urgent clinician review recommended.",
  "ai_disclaimer": "HealthNova AI provides clinical decision support and is not an autonomous diagnostic device."
}
```
