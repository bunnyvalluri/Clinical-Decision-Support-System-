# ADR: External API Integration Layer for Clinical Decision Support

## Status
Accepted

## Context
The Clinical Decision Support System (`BPY-CSE-2666`) requires access to authoritative external public healthcare reference data (such as FDA drug adverse event reports, NPPES National Provider Identifier directory, CMS open health data, and USDA nutrient profiles) to enrich clinician decision-making. 

However, external public APIs (such as those cataloged in `public-apis/public-apis`) are inherently **untrusted external systems** with variable availability, uncertified schemas, and uncontrolled endpoints. Direct access to external APIs from frontend clients or arbitrary execution by autonomous AI agents presents severe clinical and cybersecurity risks:
1. **Patient PHI Exfiltration**: Inadvertent leakage of patient names, MRNs, diagnoses, vitals, or ML risk scores to public servers.
2. **Server-Side Request Forgery (SSRF)**: Malicious exploitation of internal endpoints or cloud metadata (`169.254.169.254`).
3. **Prompt Injection**: Malicious external API text payload corrupting Ruflo multi-agent instructions.
4. **Clinical Data Corruption**: External API failures or schema drifts silently modifying patient records.

## Decision
We implement a controlled, server-side **External API Integration Layer** governed by the following architectural invariants:

1. **Sole Authoritative Store**: Neon PostgreSQL remains the sole source of truth for all clinical, patient, ML, and integration metadata. External APIs are strictly supplementary references and never store or override authoritative clinical records.
2. **Hard Clinical Boundary (Default DENY)**: 
   ```
   PATIENT DATA  X  EXTERNAL PUBLIC API
   ```
   No patient identifier or clinical health record is ever transmitted to public APIs. External requests accept only non-identifying query parameters (e.g. drug name, NPI number, nutrient code).
3. **Provider Adapter & Normalization Pattern**:
   - `ExternalAPIClient` interface: `connect()`, `authenticate()`, `request()`, `validate_response()`, `normalize()`, `health_check()`, `close()`.
   - Dedicated adapters for approved providers: `OpenFDAClient`, `NPPESClient`, `CMSClient`, `NutritionClient`.
   - Canonical internal data schemas (`ExternalDrugInformation`, `ExternalProviderInformation`, `ExternalClinicalGuideline`, `ExternalNutritionInformation`).
4. **Security Gateway**:
   - **SSRF Defense**: Strict DNS validation, private IP blocking (RFC 1918, 127.0.0.0/8, 169.254.0.0/16), protocol lockdown (HTTPS-only), domain allowlists.
   - **Resilience**: Circuit breakers (`CLOSED`, `OPEN`, `HALF_OPEN`), strict timeout ceilings (<=5s), exponential backoff retries with jitter (no retry on 400/401/403).
   - **Caching**: Short-lived Redis cache (TTL 3600s) partitioned by provider and query hash.
5. **Source Provenance & Frontend Demarcation**:
   Every returned record carries an immutable provenance envelope (`source`, `provider`, `endpoint`, `retrieved_at`, `validation_status`). The Next.js frontend visually distinguishes External Data from Internal Clinical Data, ML Predictions, and Human-Entered values.
6. **Multi-Stage Approval State Machine**:
   APIs transition through 10 explicit states:
   `DISCOVERED` -> `UNDER_REVIEW` -> `SECURITY_REVIEW` -> `PRIVACY_REVIEW` -> `CLINICAL_REVIEW` -> `APPROVED` -> `ACTIVE` -> `SUSPENDED` -> `DEPRECATED` -> `REJECTED`.
   Activation requires human clinician or administrator sign-off.
7. **Ruflo Swarm Alignment**:
   3 specialized Ruflo agents (`external-api-discovery-agent`, `external-api-security-agent`, `external-api-evaluation-agent`) assist in catalog inspection and security audit, but cannot activate APIs or execute raw network calls.

## Consequences
- **Positive**: Complete HIPAA compliance, zero PHI egress, robust SSRF protection, resilient offline fallbacks, transparent provenance for clinicians.
- **Negative**: Adds server-side processing overhead (normalization and validation); external data schemas must be actively maintained if third-party providers change.
