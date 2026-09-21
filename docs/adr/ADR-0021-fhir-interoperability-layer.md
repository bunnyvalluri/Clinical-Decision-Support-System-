# ADR-0021: HL7 FHIR Release 4 Interoperability & Clinical Data Exchange Layer

## Status
**ACCEPTED & VERIFIED** (2026-09-21)

## Context
HealthNova AI is an enterprise clinical decision support and patient risk prediction platform. To integrate with hospital EHRs (such as Epic Systems, Cerner Millennium, MEDITECH) and regional Health Information Exchanges (HIEs), the platform requires a robust data exchange mechanism. However, healthcare data exchange carries serious risks:
1. Untrusted external data could corrupt the authoritative clinical store.
2. Automated identity matching could mistakenly merge distinct patients.
3. Raw FHIR data might contain anomalous or forged vitals that pollute machine learning training and inference pipelines.

## Decision
1. **FHIR as an Interoperability Boundary, Not Database Replacement:**
   Neon PostgreSQL remains the sole authoritative application and clinical store of truth. FHIR R4 (v4.0.1) is implemented strictly as an ingress/egress translation and verification layer.
2. **Deterministic & Human-Gated Identity Matching:**
   No automated merge or overwrite is permitted when confidence is below 0.95 or when demographic conflicts are detected. Ambiguous cases route to a dedicated Informaticist Review Queue.
3. **Layered Validation Pipeline:**
   Every resource undergoes structural validation, security sanitization, identity resolution, deduplication, physiological bounds checking, and terminology crosswalking before domain persistence.
4. **Complete Data Provenance:**
   Every ingested or exported data point receives an immutable `FHIRProvenanceRecord` and `IntegrationAuditEvent` cryptographically linked to the source transaction.

## Consequences
- **Positive:** Full compliance with ONC Cures Act / US Core R4 interoperability standards; safe integration with external EHRs without risking clinical data corruption; full explainability and ML feature lineage.
- **Negative:** Increased latency for asynchronous imports through Celery queues (mitigated by real-time WebSocket notifications); requires human-in-the-loop oversight for ambiguous identity matches.
