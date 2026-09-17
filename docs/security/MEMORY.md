# Security Agent Memory vs Clinical AI Memory Isolation

## 1. Absolute Boundary
- **`SECURITY_AGENT_MEMORY`**: Stored ephemerally inside `security_workspaces/<assessment-id>/brain/`. Wiped automatically upon workspace termination. Contains zero patient identifiers or clinical context.
- **`CLINICAL_AI_MEMORY`**: Governed by Clinical Risk Context Minimization. Authoritative clinical notes reside exclusively in Neon PostgreSQL.

No cross-talk, shared vector collection, or cache sharing between the two domains is permitted.
