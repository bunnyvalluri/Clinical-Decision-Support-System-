# HealthNova AI — FHIR Troubleshooting & Issue Remediation Guide

> **Scope:** Common Errors, HTTP Status Codes, Root-Cause Analysis, Remediation  
> **Component:** HealthNova FHIR Hub  
> **Document Identifier:** HN-FHIR-TSG-2026

---

## 1. Quick Triage Decision Tree

```
                       [Integration Error Detected]
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
[HTTP 400 Bad Request]     [HTTP 409 Conflict]         [HTTP 502 / 504 / Offline]
       │                             │                             │
       ▼                             ▼                             ▼
Check FHIR Structure       Check Overwrite Guard        Check Network & TLS
- Missing resourceType     - MRN points to existing      - External endpoint down
- Invalid date format        patient with different      - Private IP blocked (SSRF)
- Missing required fields    vitals or phone number      - DNS resolution failure
```

---

## 2. Standard Error Codes & Remediation

### `FHIR_VALIDATION_ERROR` (HTTP 400)
- **Symptom:** Ingestion rejected with `OperationOutcome` diagnostic: `Missing required 'resourceType'` or `Invalid FHIR Patient.birthDate format`.
- **Cause:** External system sent non-standard FHIR or missing mandatory fields.
- **Remediation:** Inspect `FHIRValidationResult` log table in Informaticist portal; request external partner to align with US Core R4 profiles.

### `OVERWRITE_PROTECTION_TRIGGERED` (HTTP 409)
- **Symptom:** Inbound patient or clinical record returns `status: CONFLICT`.
- **Cause:** External data attempts to modify existing authoritative fields (e.g. changing phone number or gender) for a confirmed patient match without prior clinical authorization.
- **Remediation:** Informaticist navigates to `/informaticist/interoperability/reconciliation` to inspect side-by-side diff and choose `MERGE_RECORDS`, `CREATE_NEW_RECORD`, or `REJECT_INCOMING`.

### `SSRF_ATTEMPT_BLOCKED` (HTTP 403 / Security Alert)
- **Symptom:** Endpoint test returns `Target host resolves to prohibited private network range`.
- **Cause:** Endpoint base URL targets loopback (`127.0.0.1`), private RFC1918 subnet, or cloud metadata (`169.254.169.254`).
- **Remediation:** Only public HTTPS hostnames or verified partner domain names are allowed.

### `CLINICAL_BOUNDS_VIOLATION` (HTTP 422)
- **Symptom:** Observation rejected with `Value out of physiological bounds`.
- **Cause:** Measurement contains sensor error or impossible value (e.g. Heart Rate = 0 or 400 bpm).
- **Remediation:** System isolates value from ML pipeline to protect risk inference integrity.
