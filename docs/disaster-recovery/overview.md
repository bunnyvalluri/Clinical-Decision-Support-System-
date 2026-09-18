# HealthNova AI CDSS — Disaster Recovery & Business Continuity Overview

## 1. Mission Statement
HealthNova AI Clinical Decision Support System (CDSS) provides real-time patient risk stratification, early warning indicators (qSOFA, NEWS2), and diagnostic literature retrieval. The platform is engineered to maintain clinical safety, continuous operation, and immutable auditability under extreme conditions, including hardware failures, cloud provider outages, network partitions, and security incidents.

---

## 2. Core Architectural Principles

```
           [ Clinical Bedside Clients (Doctors / Nurses / Informaticists) ]
                                          │
                                 [ Nginx Reverse Proxy ]
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
           [ Next.js Frontend ]                     [ Django ASGI / Daphne ]
                                                               │
                                       ┌───────────────────────┼───────────────────────┐
                                       ▼                       ▼                       ▼
                            [ Neon PostgreSQL ]       [ Redis Broker/Cache ]     [ Local Ollama AI ]
                         (Authoritative Truth)                 │                       │
                                   │                  [ Celery Workers ]       [ Meilisearch ]
                       (Continuous WAL to S3)                  │
                                   │                 [ ML Model Registry ]
                      [ Zero-Copy PITR Branches ]
```

1. **Neon PostgreSQL is the Sole Authoritative Source of Truth**:
   All patient demographics, vital observations, clinical records, risk inferences, clinician reviews, and compliance audit logs persist exclusively in Neon Serverless PostgreSQL (`divine-smoke-01982543`, branch `production`). No secondary production database exists.
2. **Zero Fake Status Policy**:
   RPO/RTO metrics, restore success, and drill outcomes are never synthesized or fabricated. Capabilities are explicitly categorized as `CONFIGURED`, `TESTED`, `VERIFIED`, `NOT CONFIGURED`, or `NOT TESTED`.
3. **Decoupled Derived Subsystems**:
   Meilisearch, Redis cache, and vector embeddings are derived state (Category D). Their complete loss does not halt clinical care, and they can be reconstructed on-demand from Neon PostgreSQL tables.
4. **Degraded Operational Safety**:
   If inference models or AI gateways fail, the system renders `"Prediction service unavailable"`. Clinicians are alerted to fall back to bedside clinical protocols. Under no circumstances are fake risk scores generated.

---

## 3. Disaster Recovery Lifecycle

```
[ DETECTED ] ──> [ ACKNOWLEDGED ] ──> [ CONTAINED ] ──> [ RECOVERING ] ──> [ VERIFIED ] ──> [ RESOLVED ] ──> [ POSTMORTEM ]
```

- **DETECTED**: AlertService or health probes detect subsystem failure; PagerDuty / SRE notified.
- **ACKNOWLEDGED**: On-call SRE or IT Administrator claims incident and verifies blast radius.
- **CONTAINED**: Unsafe writes halted or degraded mode enabled to protect patient data integrity.
- **RECOVERING**: Runbook executed (e.g. Neon PITR branch created, Docker digest redeployed).
- **VERIFIED**: 14-Point Restoration Verification Probe executed and confirmed passing.
- **RESOLVED**: Clinical traffic routed to restored endpoint; latency and error rates nominal.
- **POSTMORTEM**: Root-cause analysis documented in `/docs/observability/incidents.md` with action items.
