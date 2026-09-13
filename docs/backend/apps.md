# Backend Apps & Domain Models

The application is structured into domain-specific Django apps inside `backend/apps/`.

---

## 1. App Inventory

| App Name | Package Path | Primary Models / Entities | Purpose |
|---|---|---|---|
| **accounts** | `apps.accounts` | `User`, `Role`, `Department` | Authentication, RBAC roles, clinician profiles |
| **patients** | `apps.patients` | `Patient` | Master patient demographics, MRN generation, soft delete |
| **clinical** | `apps.clinical` | `ClinicalRecord` | Serial encounter observations, vitals, lab biomarkers |
| **predictions** | `apps.predictions` | `Prediction`, `PredictionExplanation` | Risk predictions, confidence scores, SHAP values, overrides |
| **model_registry**| `apps.model_registry` | `ModelVersion` | Registered models, active status, accuracy benchmarks |
| **reports** | `apps.reports` | `Report` | Medical discharge summaries, compilation status, file paths |
| **notifications**| `apps.notifications`| `Notification` | Emergency alerts, notification delivery channels |
| **core** | `apps.core` | `AuditLog`, `SoftDeleteModel` | Base entities, immutable audit logging, metrics registry |
