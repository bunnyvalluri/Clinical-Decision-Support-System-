# Protected Health Information (PHI) Search & Minimization Policy

**Project:** BPY-CSE-2666 HealthNova AI  
**Standard:** HIPAA Safe Harbor & Minimum Necessary Principle (§ 164.502(b))  

---

## 1. PHI Minimization in Projections

In adherence to the Minimum Necessary standard:
1. **Direct Identifiers Stripping:** Social security numbers, complete street addresses, insurance policy IDs, and credit cards are NEVER indexed into Meilisearch under any circumstances.
2. **Pseudonymized Display Identifiers:** Patient search hits return `display_identifier` (e.g. `Patient #90241`) and masked initials when presented to users without active care-team relationships.
3. **No Clinical Free-Text Dumping:** Entire clinical progress notes and unstructured dictated encounters are not ingested wholesale into search indexes. Only structured diagnostic codes (ICD-10 / SNOMED CT) and approved encounter summaries are indexed.

---

## 2. Search Query Logging & Redaction

Query audit logs (`SearchAuditEvent`) record search telemetry without creating secondary PHI exposure:
1. **Query Hashing & Redaction:** If a search query contains patterns matching an MRN, date of birth, or phone number, the literal query string is hashed (`sha256(query + salt)`) before storage.
2. **Zero PHI in URL Parameters:** The frontend avoids passing sensitive medical queries in shareable URL paths. Session state is used for patient-identifying search parameters.
3. **Retention Limit:** Search audit logs expire after 90 days pursuant to hospital compliance schedules, whereas primary clinical audit logs in Neon PostgreSQL are retained for 7 years.
