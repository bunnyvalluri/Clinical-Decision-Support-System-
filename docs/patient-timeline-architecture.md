# Patient Timeline Architectural Specification

## Architectural Objectives
The **Patient Timeline Service** (`services.timeline_service.PatientTimelineService`) synthesizes disparate healthcare events across clinical, algorithmic, safety, and administrative domain models into a unified chronological stream.

---

## Domain Sources Aggregated

```
                        ┌──────────────────────────────┐
                        │    Patient Timeline Service  │
                        └──────────────┬───────────────┘
                                       │
      ┌────────────────┬───────────────┼────────────────┬───────────────┐
      ▼                ▼               ▼                ▼               ▼
[ClinicalRecord] [Prediction]  [ClinicalReview]  [ClinicalAlert]  [FHIR / Audit]
 Vitals/Labs      Risk Inferences Physician Reviews Safety Rules   EHR Provenance
```

1. **Admissions & Encounters**: Inpatient admissions, ER visits, and outpatient visits.
2. **Physiological Vitals**: Vitals snapshots with blood pressure, heart rate, oxygenation, and temperature.
3. **Risk Predictions**: Historical inferences including risk level, confidence, and primary attributions.
4. **Clinical Reviews**: Attending physician concurrence or risk tier overrides with documented clinical rationale.
5. **Prediction Feedback**: Qualitative utility ratings and clinician commentary.
6. **Safety Alerts & Escalations**: qSOFA triggers, severe vital excursions, and code blue/ICU transfers.
7. **AI Platform Interactions**: Safe prompt screening, context minimization checks, and guardrail audits.
8. **Interoperability & Data Quality**: Ingestion of FHIR R4 resources and signal quality flags.

---

## Performance & Query Optimizations
- **Indexed Queries**: All domain queries leverage composite indexes on `(patient_id, created_at DESC)` and `(patient_id, recorded_at DESC)`.
- **In-Memory Normalization**: Domain entities are transformed into standard `TimelineEvent` representations before memory sorting and slicing.
- **Server-Side Pagination**: Supports `offset` and `limit` to prevent excessive egress on patients with thousands of telemetry entries.
- **Role-Based Filtering**: Clinician vs. patient visibility is resolved server-side before serialization.
