# HealthNova AI — FHIR Resource Mapping & Normalization Specification

> **Mapping Standard:** Versioned Declarative Bi-directional Transformations  
> **Source Standards:** HL7 FHIR Release 4 (v4.0.1)  
> **Target Schema:** Neon PostgreSQL Clinical Domain Models  
> **Document Identifier:** HN-MAPPING-SPEC-2026

---

## 1. Scope of Resource Mappings

HealthNova AI provides audited, bi-directional mappings between standard HL7 FHIR R4 resources and internal Neon PostgreSQL relational models:

```
[FHIR R4 Patient]           ◄──►  [apps.patients.models.Patient]
[FHIR R4 Observation]       ◄──►  [apps.clinical.models.ClinicalRecord (Vitals)]
[FHIR R4 Condition]         ◄──►  [apps.clinical.models.ClinicalRecord (Diagnoses)]
[FHIR R4 Encounter]         ◄──►  [apps.clinical.models.ClinicalRecord (Encounters)]
[FHIR R4 RiskAssessment]    ◄──   [apps.predictions.models.Prediction] (Outbound)
[FHIR R4 DiagnosticReport]   ──►  [apps.clinical.models.ClinicalRecord] (Inbound)
[FHIR R4 ServiceRequest]     ──►  [apps.clinical.models.ClinicalRecord] (Inbound)
```

---

## 2. Granular Field Crosswalks

### A. FHIR `Patient` ◄► `apps.patients.models.Patient`

| FHIR R4 Path | Data Type | Internal Model Field | Transformation Rule |
| :--- | :--- | :--- | :--- |
| `id` | `id` (string) | External ID / Provenance | Preserved in `FHIRProvenanceRecord.external_resource_id` |
| `identifier[system='...mrn'].value` | `string` | `mrn` | Extracted and normalized (whitespace stripped, uppercase) |
| `name[0].given[0]` | `string` | `first_name` | Direct mapping with Unicode normalization |
| `name[0].family` | `string` | `last_name` | Direct mapping with Unicode normalization |
| `gender` | `code` | `gender` | Mapped: `male` -> `MALE`, `female` -> `FEMALE`, other -> `OTHER` |
| `birthDate` | `date` (YYYY-MM-DD) | `date_of_birth` | Parsed to Python `datetime.date` |
| `telecom[system='phone'].value` | `string` | `phone_number` | E.164 phone normalization |
| `telecom[system='email'].value` | `string` | `email` | Lowercased RFC 5322 validation |
| `address[0].text` | `string` | `address` | Composed from line, city, state, postalCode |
| `contact[0].name.text` | `string` | `emergency_contact_name` | Extracted from primary contact |
| `contact[0].telecom[system='phone'].value` | `string` | `emergency_contact_phone`| Primary contact phone |
| `contact[0].relationship[0].text` | `string` | `emergency_contact_relation`| Primary contact relationship |

### B. FHIR `Observation` ◄► `apps.clinical.models.ClinicalRecord`

| FHIR R4 Path | Data Type | Internal Model Field | Clinical Unit |
| :--- | :--- | :--- | :--- |
| `code.coding[system='http://loinc.org'].code = '8480-6'` | `Quantity` | `systolic_bp` | `mm[Hg]` |
| `code.coding[system='http://loinc.org'].code = '8462-4'` | `Quantity` | `diastolic_bp` | `mm[Hg]` |
| `code.coding[system='http://loinc.org'].code = '8867-4'` | `Quantity` | `heart_rate` | `/min` |
| `code.coding[system='http://loinc.org'].code = '9279-1'` | `Quantity` | `respiratory_rate` | `/min` |
| `code.coding[system='http://loinc.org'].code = '8310-5'` | `Quantity` | `body_temperature` | `Cel` (°C) |
| `code.coding[system='http://loinc.org'].code = '2708-6'` | `Quantity` | `oxygen_saturation` | `%` |
| `code.coding[system='http://loinc.org'].code = '2345-7'` | `Quantity` | `glucose_level` | `mg/dL` |
| `effectiveDateTime` | `dateTime` | `recorded_at` | Converted to UTC ISO 8601 |
| `performer[0]` | `Reference` | `recorded_by` | Matched to internal clinician User |

### C. `apps.predictions.models.Prediction` ──► FHIR `RiskAssessment`

| Internal Model Field | FHIR R4 Target Path | Clinical Meaning |
| :--- | :--- | :--- |
| `prediction_result` (`HIGH`, `MEDIUM`, `LOW`) | `prediction[0].qualitativeRisk.coding.code` | Overall categorical clinical risk |
| `probability` (e.g. `0.7850`) | `prediction[0].probabilityDecimal` | Calibrated model risk probability (0.0 to 1.0) |
| `model_name` | `method.coding.display` | Name of predictive ML architecture |
| `model_version_str` | `basis[0].display` | Model semantic version |
| `inference_latency_ms` | `extension[url='...latency'].valueDecimal` | Inference execution latency |
| `features_snapshot` | `basis` (References to Observations) | Feature inputs evaluated during inference |
| `created_at` | `occurrenceDateTime` | Timestamp of prediction generation |
