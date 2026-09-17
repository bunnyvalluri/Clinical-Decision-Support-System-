# Search Index Design & Schema Specifications

**Project:** BPY-CSE-2666 (HealthNova AI Clinical Decision Support System)  
**Engine:** Meilisearch v1.12.0  

---

## 1. Index Registry & Classifications

Each search index is classified according to data sensitivity, role permissions, and retention rules:

| Index UID | Entity Type | Classification | Primary Key | Authorized Roles |
| :--- | :--- | :--- | :--- | :--- |
| `patients` | `Patient` | `PHI` | `document_id` | DOCTOR, NURSE, IT_ADMIN (metadata only), PATIENT (self only) |
| `clinical_records` | `ClinicalRecord` | `PHI` | `document_id` | DOCTOR, NURSE |
| `predictions` | `Prediction` | `SENSITIVE` | `document_id` | DOCTOR, NURSE, MEDICAL_INFORMATICIST, PATIENT (self only) |
| `triage_records` | `TriageRecord` | `SENSITIVE` | `document_id` | NURSE, DOCTOR |
| `clinical_tasks` | `ClinicalTask` | `INTERNAL` | `document_id` | NURSE, DOCTOR |
| `escalations` | `Escalation` | `SENSITIVE` | `document_id` | DOCTOR, NURSE |
| `models` | `ModelVersion` | `INTERNAL` | `document_id` | MEDICAL_INFORMATICIST, IT_ADMIN, DOCTOR |
| `data_quality` | `DataQualityIssue` | `INTERNAL` | `document_id` | MEDICAL_INFORMATICIST, IT_ADMIN |
| `ai_evaluations` | `AIInteraction` | `INTERNAL` | `document_id` | MEDICAL_INFORMATICIST, IT_ADMIN, DOCTOR |
| `whiteboards` | `ClinicalWhiteboard`| `INTERNAL` | `document_id` | DOCTOR, NURSE, MEDICAL_INFORMATICIST, IT_ADMIN |
| `system_events` | `SystemEvent` / Audit | `RESTRICTED` | `document_id` | IT_ADMIN |
| `knowledge_sources` | `KnowledgeSource` | `PUBLIC` | `document_id` | ALL ROLES |

---

## 2. Universal Document Envelope

Every document indexed in Meilisearch implements the following standardized metadata contract:

```json
{
  "document_id": "patient_10294",
  "entity_type": "patient",
  "source_id": "10294",
  "tenant_id": "hospital_main",
  "organization_id": "org_healthnova",
  "care_team_id": "cardiology_team_a",
  "user_id": 42,
  "classification": "PHI",
  "schema_version": "1.0.0",
  "updated_at": 1758110400,
  "indexed_at": 1758110405
}
```

---

## 3. Attribute Configurations & Typo Tolerance Policies

### 3.1 `patients` Index
* **Searchable Attributes:** `display_name`, `first_name`, `last_name`, `mrn`, `care_team_id`
* **Filterable Attributes:** `patient_id`, `mrn`, `is_active`, `care_team_id`, `primary_physician_id`, `user_id`, `organization_id`, `blood_group`
* **Sortable Attributes:** `last_name`, `updated_at`, `created_at`
* **Typo Tolerance Policy:**
  - `disableOnAttributes`: `["mrn", "patient_id", "source_id"]`
  - `disableOnNumbers`: `true`
  *Critical Safety Rule:* An MRN query like `MRN-90241` must NEVER fuzzily match `MRN-90242`. Exact matching is enforced.

### 3.2 `predictions` Index
* **Searchable Attributes:** `patient_mrn`, `model_name`, `model_version`, `prediction_result`, `clinical_summary`
* **Filterable Attributes:** `patient_id`, `model_version`, `prediction_result`, `risk_level`, `primary_physician_id`, `organization_id`, `created_at`
* **Sortable Attributes:** `created_at`, `probability`, `updated_at`
* **Typo Tolerance Policy:**
  - `disableOnAttributes`: `["patient_mrn", "patient_id", "model_version", "source_id"]`

### 3.3 `models` Index
* **Searchable Attributes:** `name`, `algorithm`, `version`, `description`, `created_by_name`
* **Filterable Attributes:** `status`, `algorithm`, `version`, `is_active`, `is_default`
* **Sortable Attributes:** `created_at`, `roc_auc`, `f1_score`, `brier_score`
* **Typo Tolerance Policy:** Enabled for general words, disabled for version tags (`version`).
