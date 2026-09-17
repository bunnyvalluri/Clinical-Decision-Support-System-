# Clinical Search Quality, Telemetry & Evaluation

**Project:** BPY-CSE-2666 HealthNova AI  
**Scope:** Search Relevance Metrics, Identifier Precision, and Anonymized Telemetry  

---

## 1. Clinical Relevance vs Generic Search Relevance

Generic search engines optimize for recall and click-through rates. Clinical search prioritizes:
1. **100% Precision on Exact Medical Identifiers:** If a clinician searches `MRN-90241`, the exact match MUST be returned first with zero ambiguity.
2. **Authorization Strictness:** Unauthorized records must NEVER appear in results, even if query terms perfectly match.
3. **Temporal Freshness:** Recent vital records and deteriorating risk assessments rank ahead of historical encounters.

---

## 2. Telemetry & Quality Metrics (`SearchAnalyticsService`)

We measure search performance without capturing private clinician search queries:
- **Zero-Result Rate:** Percentage of clinical searches returning 0 results (identifies vocabulary gaps).
- **Latency Distribution:** p50, p95, p99 latency per index category (target p95 < 35ms).
- **Fallback Trigger Rate:** Frequency of fallback to PostgreSQL search.
- **Task Processing Lag:** Time from PostgreSQL commit to Meilisearch index availability.
