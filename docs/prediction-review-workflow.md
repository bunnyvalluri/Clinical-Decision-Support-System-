# Physician Human-in-the-Loop (HITL) Prediction Review Workflow

## Regulatory & Clinical Framework
HealthNova AI is an assistive Software as a Medical Device (SaMD). Under FDA guidance (21 CFR Part 11 and EU MDR 2017/745):
- **AI NEVER issues autonomous diagnoses or prescriptions.**
- **High and Critical risk predictions require explicit clinician concurrence or override.**
- **Overrides are strictly non-repudiable**: They require a licensed clinician identity, timestamp, target risk level, and mandatory clinical rationale.

---

## Review Lifecycle States

```
[MODEL INFERENCE] 
       │
       ▼
[PENDING_REVIEW] ──(Physician Review)──► [CONCUR] ────► [REVIEWED]
       │                                     │
       │                                     ▼
       │                              Immutable Audit
       │                              PostgreSQL Record
       │
       └──────────(Physician Override)► [OVERRIDE] ──► [OVERRIDDEN]
                                             │
                                             ▼
                                     Mandatory Rationale
                                     + Target Risk Tier
```

---

## API Endpoints & Request Contracts

### 1. Recording Physician Review Decision
`POST /api/v1/predictions/reviews/{id}/decision/` or `POST /api/v1/prediction-reviews/{id}/decision/`

**Request Body (Concurrence):**
```json
{
  "decision": "CONCUR",
  "status": "REVIEWED",
  "rationale": "Patient examination consistent with elevated cardiovascular risk."
}
```

**Request Body (Override):**
```json
{
  "decision": "OVERRIDE",
  "status": "REVIEWED",
  "override_risk_level": "MEDIUM",
  "rationale": "Artifactual SpO2 reading due to cold extremities. Arterial blood gas confirmed normal PaO2. Down-titrating risk tier to MEDIUM."
}
```

---

## Real-Time Channel Broadcasting

Upon successful sign-off, the review handler:
1. Emits a `PredictionReviewedEvent` or `PredictionOverriddenEvent` to `patient_{patient_id}` Django Channel.
2. Writes an immutable `PatientTimelineEvent` with `event_type = PREDICTION_REVIEW` or `PREDICTION_OVERRIDE`.
3. Notifies connected WebSocket clients for real-time multi-clinician workspace synchronization.
