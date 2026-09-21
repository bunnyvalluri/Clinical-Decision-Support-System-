# HealthNova AI — Patient Identity Matching & Master Patient Index (MPI)

> **Specification Standard:** Deterministic & Probabilistic Multi-Factor MPI  
> **Authoritative Database:** Neon PostgreSQL  
> **Document Identifier:** HN-MPI-SPEC-2026

---

## 1. Objectives & Safety Invariant

Incorrect patient record linking is one of the most critical patient safety hazards in digital health. The HealthNova AI Patient Identity Matching Subsystem enforces the following core safety invariant:

```
╔════════════════════════════════════════════════════════════════════════════╗
║ ZERO AUTONOMOUS PATIENT MERGING:                                           ║
║ No automated process, heuristic algorithm, or AI agent may merge           ║
║ patient records or assign conflicting external clinical data without       ║
║ explicit, authenticated human clinician/informaticist verification.       ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Match Resolution State Machine

Each incoming FHIR resource referencing a patient traverses the identity resolution state machine:

```
                   [Incoming FHIR Resource]
                              │
                              ▼
                 [Identity Match Evaluator]
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
Confidence >= 0.95     0.70 <= Conf < 0.95    Conf < 0.70
Exact MRN + DOB Match   Conflicting Data      No Known Identifiers
        │                     │                     │
        ▼                     ▼                     ▼
[MATCH_CONFIRMED]      [MATCH_AMBIGUOUS]     [MATCH_NOT_FOUND]
        │                     │                     │
  Direct Link                 ▼                     ▼
  to Internal         [Generate Conflict]   [Review Queue: Create
  Patient UUID        (Human Review Queue)   New Patient or Link]
```

### Match States

| State | Definition | Action Taken |
| :--- | :--- | :--- |
| `MATCH_CONFIRMED` | Exact match on registered external system ID, OID, or internal Medical Record Number (MRN) combined with Date of Birth (DOB). | Link directly to internal `Patient` model; proceed with ingestion. |
| `MATCH_POSSIBLE` | Single candidate found matching Name and DOB, but external identifier is unindexed. | Emits warning; links conditionally if trust level is `AUTHORITATIVE_PARTNER`, otherwise queues for verification. |
| `MATCH_AMBIGUOUS` | Multiple internal patients match demographics, or identifier points to one patient but DOB points to another. | Ingestion pauses; creates `FHIRMappingConflict` (`DUPLICATE_PATIENT_MATCH`); requires human reconciliation. |
| `MATCH_NOT_FOUND` | No internal patient matches the provided identifiers or demographics. | System flags payload for clinician review or creates a provisional unverified chart subject to organizational policy. |
| `MATCH_REJECTED` | Identified patient has been explicitly flagged as a non-match by an Informaticist during prior review. | Rejects ingestion; logs audit alert. |
| `REVIEW_REQUIRED` | Clinical data contains high-entropy or conflicting demographics (e.g. name changed, different gender code). | Queues item in Informaticist Review Portal. |

---

## 3. Human Reconciliation Actions

When an identity conflict is reviewed by an authorized Medical Informaticist or Health Records Administrator, the following audited resolution actions are available:

1. **`MERGE_RECORDS`**: Confirm that the external resource represents the selected internal patient. Binds the external identifier to `PatientIdentityLink` for future zero-latency automatic matching.
2. **`CREATE_NEW_RECORD`**: Confirm that the external resource is a distinct, new individual. Initializes a new internal `Patient` record in Neon PostgreSQL.
3. **`REJECT_INCOMING`**: Discard the incoming external data. The external source is notified via standard FHIR `OperationOutcome` error.
4. **`ESCALATE_REVIEW`**: Forward the case to the Lead Medical Director or HIM Committee for clinical governance evaluation.
