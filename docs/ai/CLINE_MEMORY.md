# Memory Segregation & Data Retention — Cline Integration

> **Standard**: Zero-PHI Memory Storage Principle  

---

## 1. Memory Namespace Partitioning

Cline agent memory is segregated into disjoint, strictly controlled namespaces:

1. `engineering`: Project architecture, dependency maps, build configuration cache.
2. `project_knowledge`: Institutional policies, approved coding styles, API schemas.
3. `session_context`: Ephemeral conversational state (auto-expires after 24 hours).
4. `evaluation`: Benchmark results and synthetic test datasets.

---

## 2. Mandatory Memory Invariants
- **ZERO Patient PHI**: It is strictly forbidden to store patient medical records, names, or identifiable clinical data in agent memory.
- **TTL Enforcement**: Ephemeral session memories enforce a strict Time-To-Live (TTL) purged by Celery periodic tasks.
- **Clinical Source of Truth**: When a clinical fact is needed, it must be queried in real time from Neon PostgreSQL; it must never be recalled from unverified agent memory.
