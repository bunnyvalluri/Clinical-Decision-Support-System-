# Clinical Decision Support System (CDSS) Workflow — BPY-CSE-2666

## Core Architectural Principle
The HealthNova AI Clinical Decision Support System operates as an **advisory and augmentation tool** for licensed healthcare practitioners. Under no circumstances does the system render autonomous medical diagnoses, initiate automatic treatments, or dispatch unsupervised prescriptions. Every clinical recommendation, alert, and trajectory analysis requires explicit human clinician sign-off.

---

## End-to-End Decision Support Lifecycle

```
[ CLINICAL ENCOUNTER / REAL-TIME VITALS ]
                  │
                  ▼
[ 1. Feature Preprocessing & Bound Validation ]
    ├── Checks against 16 physiological parameters (e.g., SBP [40-300 mmHg])
    └── Emits structured 400 Bad Request if out-of-range or missing
                  │
                  ▼
[ 2. Data Quality & OOD Evaluation ]
    ├── Out-of-Distribution scoring against training distribution
    └── Sensor drift and anomalous measurement flagging
                  │
                  ▼
[ 3. Multi-Model ML Risk Stratification ]
    ├── Champion: Random Forest Classifier (v1.0.0, acc=1.0)
    ├── Output: Risk Tier (LOW, MEDIUM, HIGH, CRITICAL) + Calibrated Probability
    └── Uncertainty Assessment: Shannon Entropy & Margin (Abstention if entropy > 0.85)
                  │
                  ▼
[ 4. Deterministic Clinical Safety Overrides ]
    ├── Sepsis Protocol: qSOFA (Respiratory Rate, SBP, GCS)
    ├── Deterioration Track: NEWS2 Clinical Score
    └── Immediate Critical Alerts: Severe Hypoxia (SpO2 < 88%), Hypertensive Crisis
                  │
                  ▼
[ 5. Explainability Synthesis (TreeSHAP) ]
    ├── Top driving risk factors with exact directional attributions
    └── Top protective clinical factors
                  │
                  ▼
[ 6. Neon PostgreSQL Persistence & Real-Time Broadcast ]
    ├── Write to `predictions_prediction` and `predictions_predictionexplanation`
    ├── Broadcast via Django Channels (`risk_prediction_completed` WebSocket event)
    └── Emit critical alerts to doctor notification center if HIGH/CRITICAL
                  │
                  ▼
[ 7. Attending Clinician Review & Override ]
    ├── Physician reviews attribution waterfall and deterministic alerts
    ├── Accepts AI recommendation or registers clinical override
    └── PostgreSQL immutable audit trail records decision, rationale, and timestamp
```

---

## Suggested Review Urgency Matrix

| Assessed Risk Tier | Deterministic Triggers | Suggested Review Urgency | Notification Channel |
|---|---|---|---|
| **CRITICAL** | Acute Hypoxia / Severe Shock / qSOFA >= 2 | `MANDATORY_STAT` (Immediate bed-side evaluation) | Audio-visual emergency alert, WebSocket broadcast, push notification |
| **HIGH** | Significant multi-vital elevation / NEWS2 >= 5 | `REQUIRED` (Evaluation within 1 hour) | Clinical portal priority badge, notification center |
| **MEDIUM** | Moderate hypertension or lab elevation | `ROUTINE` (Review during regular rounds) | Patient timeline card |
| **LOW** | Normal physiological ranges | `ROUTINE` (Standard monitoring protocol) | Patient timeline card |
| **ANY (High Entropy)** | Normalized Shannon Entropy > 0.85 | `ABSTAINED` (Model abstains, clinician evaluation required) | Warning flag indicating uncertain prediction |

---

## Clinician Override Mechanism

Attending physicians have full authority to override model assessments through the Clinical Review Panel:
1. Navigate to Patient Risk Assessment view.
2. Review the TreeSHAP waterfall plot and deterministic clinical alerts.
3. If clinical judgment differs from model output (e.g. unmeasured clinical signs like diaphoresis or pallor), select the revised risk tier.
4. Input mandatory clinical rationale (minimum 10 characters).
5. Submit decision: updates `Prediction.clinician_override` and writes an immutable audit record to `AuditLog`.
