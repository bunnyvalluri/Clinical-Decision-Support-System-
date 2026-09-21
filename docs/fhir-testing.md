# HealthNova AI — FHIR Testing Strategy & Quality Assurance Guide

> **Test Suite:** `apps.interoperability.tests`  
> **Synthetic Datasets:** `apps.interoperability.tests.fixtures.synthetic_fixtures`  
> **Document Identifier:** HN-FHIR-TEST-2026

---

## 1. Zero-PHI Synthetic Testing Standard

To comply with HIPAA Safe Harbor and GDPR requirements, HealthNova AI forbids the use of real Protected Health Information (PHI) in test cases, fixtures, CI pipelines, or local development environments. All tests use synthetic patients and physiological vectors generated mathematically or derived from public standard datasets (e.g. Synthea).

---

## 2. Test Architecture

The interoperability test suite covers seven core modules:

1. **`test_fhir_validators.py`**:
   - Tests structural validation of Patient, Observation, Encounter, RiskAssessment.
   - Tests detection of invalid birth dates, unrecognized genders, and missing mandatory fields.
   - Tests clinical bounds validation (e.g. rejection of systolic blood pressure > 300 mmHg or body temperature < 30°C).
2. **`test_mappings.py`**:
   - Tests bi-directional translation of Patient demographics (FHIR HumanName, Telecom, Address) to internal `Patient` model.
   - Tests translation of LOINC vitals (BP, Heart Rate) to internal `ClinicalRecord`.
   - Tests export of `Prediction` and SHAP attributions into FHIR R4 `RiskAssessment`.
3. **`test_duplicate_detection.py`**:
   - Tests SHA-256 payload fingerprinting and transaction deduplication across repeated deliveries.
4. **`test_conflict_resolution.py`**:
   - Tests human reconciliation workflow: `MERGE_RECORDS`, `CREATE_NEW_RECORD`, `REJECT_INCOMING`, `OVERWRITE_EXISTING`.
5. **`test_provenance_audit.py`**:
   - Tests cryptographic provenance tracking, source system tagging, and `IntegrationAuditEvent` emission.
6. **`test_interoperability_api.py`**:
   - Tests DRF endpoints: CapabilityStatement (`/fhir/r4/metadata`), Resource CRUD (`/fhir/r4/Patient`), `$everything` Bundle export, Informaticist Status Dashboard, and RBAC enforcement.
7. **`test_negative_security_and_governance.py`**:
   - Tests SSRF prevention against private IP addresses (`127.0.0.1`, `169.254.169.254`), oversized payload rejection, and unauthenticated API rejections.

---

## 3. Running the Test Suite

Execute the tests inside the backend Python environment:

```bash
# Run complete interoperability test suite
python manage.py test apps.interoperability.tests --keepdb

# Run individual test modules
python manage.py test apps.interoperability.tests.test_fhir_validators
python manage.py test apps.interoperability.tests.test_mappings
python manage.py test apps.interoperability.tests.test_interoperability_api
```
