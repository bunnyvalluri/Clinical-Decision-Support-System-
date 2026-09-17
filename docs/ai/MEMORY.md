# Persistent Agent Memory & Data Classification

## 1. Healthcare Memory Invariants
In standard AI agents, long-term memory stores arbitrary user inputs or context. In clinical environments, storing Protected Health Information (PHI) in unencrypted agent memory creates severe regulatory and privacy liabilities.

HealthNova AI enforces:
1. **Data Classification Barrier**:
   - `AgentMemory` records must declare a `DataClassification`:
     - `PUBLIC` (general medical terms)
     - `LOW_SENSITIVITY` (de-identified trends)
     - `SENSITIVE` (operational hospital states)
     - `PHI` / `HIGHLY_SENSITIVE` / `AUTHENTICATION_SECRET`
2. **Prohibited Persistent Keys**:
   - Keys containing `password`, `token`, `secret`, `ssn`, `api_key` are rejected by `MemoryService`.
3. **Session & User Isolation**:
   - Relational foreign keys isolate memory per session and per authenticated user. Cross-session leakage is structurally impossible.
4. **Time-To-Live (TTL)**:
   - Memories can specify an optional `expires_at` timestamp for automated lifecycle expiration.
