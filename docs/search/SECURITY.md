# Search Security Architecture & Threat Defense

**Project:** BPY-CSE-2666 HealthNova AI  
**Scope:** Search Engine Integration, Filter Injection Defense, Secrets Isolation  

---

## 1. Threat Modeling & Mitigations

| Threat | Attack Vector | Architecture Mitigation |
| :--- | :--- | :--- |
| **Filter Injection** | Attacker injects boolean operators (`OR 1=1`) in query filter params. | Abstract Syntax Tree (AST) structured filter builder in Django. Raw filter strings from clients are never concatenated into Meilisearch queries. |
| **IDOR / Tenant Crossing** | User alters `patient_id` or `tenant_id` to view another patient's records. | Mandatory server-side filter synthesis in `SearchPolicyService`. Client tenant/patient params are discarded in favor of claims extracted from authenticated JWT. |
| **Master Key Exposure** | Leakage of `MEILI_MASTER_KEY` via frontend bundles or logs. | Strict env isolation. Master key is accessible only to server-side Django/Celery. Zero `NEXT_PUBLIC_*` exposure. |
| **XSS via Search Highlight** | Malicious script payload stored in searchable field returned inside highlights. | React default string escaping; custom highlighting components use DOMPurify/strict regex text node rendering without `dangerouslySetInnerHTML`. |
| **Search Enumeration / Harvest** | Automated crawler iterating through MRNs to scrape patient census. | Aggressive rate-limiting on search endpoints (30 queries/minute for search, 60/min for suggestions) plus automated heuristic anomaly detection for high-cardinality queries. |
| **Prompt Injection via RAG** | Malicious text in indexed note instructing LLM to ignore system prompt. | Retrieval text is wrapped in data containers with XML delimiters (`<retrieved_context>`) and labeled as untrusted third-party evidence. |

---

## 2. Master Key Management & Rotation Policy

1. **Storage:** `MEILISEARCH_MASTER_KEY` is maintained exclusively in root `.env` / Kubernetes secrets. It is never checked into Git or exposed via API.
2. **Rotation Lifecycle:**
   - Meilisearch permits rotating the master key by restarting the container with the new key.
   - Django and Celery workers are updated concurrently via zero-downtime rolling restart.
   - Tenant tokens generated under previous keys expire automatically within 15 minutes.
