"""
Generator for docs/database/ and docs/api/
"""
from pathlib import Path

DOCS_DIR = Path(r"c:\4-1\docs")


def write_file(rel_path: str, content: str):
    p = DOCS_DIR / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Created {rel_path} ({len(content)} chars)")


def generate():
    # =============================================================
    # docs/database/ (8 files)
    # =============================================================
    write_file("database/overview.md", """
# Database Overview

The **PatientRisk Clinical Decision Support System** relies on a normalized relational schema hosted on **Neon Serverless PostgreSQL**.

---

## 1. Relational Design Principles

1. **Strict Normalization:** Demographics (`patients_patient`), physiological observations (`clinical_clinicalrecord`), ML inferences (`predictions_prediction`), and explanations (`predictions_predictionexplanation`) are strictly separated to maintain clinical audit integrity and avoid redundant data.
2. **UUID Primary Keys:** All major entities use RFC 4122 Version 4 UUIDs (`uuid_generate_v4()`) to prevent enumeration attacks and simplify distributed replication.
3. **Soft Deletion (`is_deleted`):** Medical records and patient profiles are never hard-deleted; soft deletion ensures longitudinal audit compliance.
4. **Optimized Indexing:** Compound B-Tree indexes are deployed on high-frequency search fields (MRN, patient ID, recorded timestamp).
""")

    write_file("database/neon-postgresql.md", """
# Neon PostgreSQL Configuration

Neon is the cloud-native serverless PostgreSQL platform powering the PatientRisk CDSS backend.

---

## 1. Connection Configurations

Neon provides distinct connection endpoints:

```
+-----------------------------------------------------------------------------------+
| Neon PostgreSQL Cloud Instance                                                    |
|                                                                                   |
|  [ Direct Compute Endpoint ]                [ Pooled PgBouncer Endpoint ]         |
|  ep-tight-resonance-123456.neon.tech        ep-tight-resonance-123456-pooler.tech |
|  - Used for Schema Migrations               - Used for Django Web Workers         |
|  - Supports DDL, LISTEN/NOTIFY              - Manages Concurrency / Connection    |
|  - Direct connection to PostgreSQL engine   - Scale-to-zero friendly              |
+-----------------------------------------------------------------------------------+
```

### Environment Configuration
```env
# Pooled endpoint for application workers
DATABASE_URL=postgresql://neondb_owner:password@ep-tight-resonance-123456-pooler.c-2.neon.tech/neondb?sslmode=require

# Direct endpoint for migrations
DIRECT_DATABASE_URL=postgresql://neondb_owner:password@ep-tight-resonance-123456.c-2.neon.tech/neondb?sslmode=require
```

### Connection Pool Sizing
- `CONN_MAX_AGE = 600` (10 minutes) to reuse connections without leaking resources.
- PgBouncer operates in transaction-pooling mode.
""")

    write_file("database/schema.md", """
# Database Schema & Entity-Relationship Diagram

This diagram represents the actual relational data models implemented in the application.

---

## 1. Mermaid Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ PATIENT : primary_physician
    USER ||--o{ CLINICAL_RECORD : recorded_by
    USER ||--o{ PREDICTION : requested_by
    USER ||--o{ PREDICTION : overridden_by
    USER ||--o{ REPORT : generated_by
    USER ||--o{ NOTIFICATION : user
    USER ||--o{ AUDIT_LOG : user

    PATIENT ||--o{ CLINICAL_RECORD : clinical_records
    PATIENT ||--o{ PREDICTION : predictions
    PATIENT ||--o{ REPORT : reports

    MODEL_VERSION ||--o{ PREDICTION : predictions

    CLINICAL_RECORD ||--o{ PREDICTION : predictions

    PREDICTION ||--|| PREDICTION_EXPLANATION : explanation
    PREDICTION ||--o{ REPORT : reports

    USER {
        uuid id PK
        string email UK
        string username UK
        string role
        string department
        boolean is_active
        datetime date_joined
    }

    PATIENT {
        uuid id PK
        string mrn UK
        string first_name
        string last_name
        date date_of_birth
        string gender
        string blood_group
        string phone_number
        string email
        uuid primary_physician_id FK
        boolean is_deleted
        datetime created_at
    }

    CLINICAL_RECORD {
        uuid id PK
        uuid patient_id FK
        uuid recorded_by_id FK
        string encounter_type
        decimal systolic_bp
        decimal diastolic_bp
        integer heart_rate
        integer respiratory_rate
        decimal oxygen_saturation
        decimal body_temperature
        decimal glucose_level
        decimal cholesterol_total
        decimal bmi
        decimal creatinine
        decimal sodium
        decimal potassium
        datetime recorded_at
    }

    MODEL_VERSION {
        uuid id PK
        string model_name
        string version UK
        string algorithm
        string status
        decimal accuracy
        decimal roc_auc
        string artifact_location
        datetime registered_at
    }

    PREDICTION {
        uuid id PK
        uuid patient_id FK
        uuid clinical_record_id FK
        uuid model_version_id FK
        string prediction_result
        decimal probability
        decimal confidence_score
        decimal inference_latency_ms
        string clinician_override
        text override_reason
        uuid overridden_by_id FK
        jsonb features_snapshot
        datetime created_at
    }

    PREDICTION_EXPLANATION {
        uuid id PK
        uuid prediction_id FK,UK
        jsonb top_features
        decimal base_value
        string disclaimer
        datetime created_at
    }

    REPORT {
        uuid id PK
        uuid patient_id FK
        uuid prediction_id FK
        uuid generated_by_id FK
        string report_type
        string format
        string status
        string file_path
        integer file_size_bytes
        datetime created_at
    }

    NOTIFICATION {
        uuid id PK
        uuid user_id FK
        string title
        text message
        string severity
        string channel
        boolean is_read
        datetime created_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        string resource_id
        string ip_address
        jsonb metadata
        datetime created_at
    }
```
""")

    write_file("database/models.md", """
# Database Models Specification

This document details each Django ORM model entity and its clinical purpose.

---

## 1. Models Inventory

### 1.1 `User` (`apps.accounts.models.User`)
Custom user model extending `AbstractUser`:
- `email`: Institutional email address (unique username identifier).
- `role`: Clinical role taxonomy (`ADMIN`, `CLINICIAN`/`DOCTOR`, `NURSE`, `STAFF`, `PATIENT`).
- `department`: Clinical department assignment (e.g., Cardiology, Emergency, ICU).

### 1.2 `Patient` (`apps.patients.models.Patient`)
Demographic master record:
- `mrn`: Medical Record Number (e.g., `MRN-2026-0001`), unique indexed.
- `date_of_birth`: Used to derive patient age dynamically during feature preprocessing.
- `gender`: Biological sex category (`MALE`, `FEMALE`, `OTHER`, `UNKNOWN`).
- `blood_group`: ABO/Rh typing (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- `primary_physician`: Foreign key to `User`.

### 1.3 `ClinicalRecord` (`apps.clinical.models.ClinicalRecord`)
Encounter vitals and biomarkers:
- `systolic_bp`, `diastolic_bp`: Blood pressure measurements in mmHg.
- `heart_rate`, `respiratory_rate`: Vital frequencies.
- `oxygen_saturation`: Pulse oximetry percentage.
- `glucose_level`, `cholesterol_total`: Serum lab results.
- `bmi`, `creatinine`, `sodium`, `potassium`: Renal and metabolic indicators.

### 1.4 `Prediction` (`apps.predictions.models.Prediction`)
Output of ML inference:
- `prediction_result`: Stratified risk (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- `probability`: Continuous model probability $[0.0, 1.0]$.
- `confidence_score`: Empirical certainty measure.
- `inference_latency_ms`: Computational time required for model execution.
- `clinician_override`: Physician-assigned risk override.
- `override_reason`: Mandatory clinical justification for override.

### 1.5 `PredictionExplanation` (`apps.predictions.models.PredictionExplanation`)
SHAP factor interpretation:
- `top_features`: JSON array of feature contributions with directional impacts.
- `base_value`: Background population risk baseline.
- `disclaimer`: Mandatory legal notice for medical decision support.
""")

    write_file("database/relationships.md", """
# Database Relationships & Constraints

This document defines relational integrity rules and foreign key cascade behaviors.

---

## 1. Key Relationships

| Parent Table | Child Table | Relation Type | Cascade Rule | Business Rationale |
|---|---|---|---|---|
| `User` | `Patient` | One-to-Many | `ON DELETE SET_NULL` | Retains patient records if attending physician account is deactivated |
| `Patient` | `ClinicalRecord` | One-to-Many | `ON DELETE CASCADE` | Observations are bound to patient lifespan |
| `Patient` | `Prediction` | One-to-Many | `ON DELETE CASCADE` | Predictions belong to patient longitudinal history |
| `ClinicalRecord` | `Prediction` | One-to-Many | `ON DELETE SET_NULL` | Predictions retained even if observation record is edited |
| `Prediction` | `PredictionExplanation`| One-to-One | `ON DELETE CASCADE` | Explanation is strictly bound to its parent inference |
| `ModelVersion` | `Prediction` | One-to-Many | `ON DELETE PROTECT` | Prevents deleting ML model versions that have active clinical predictions |
""")

    write_file("database/indexes.md", """
# Database Indexes & Query Optimization

Indexes are deployed across relational tables to ensure low latency under clinical query workloads.

---

## 1. Index Catalog

| Table | Index Name / Type | Columns | Purpose |
|---|---|---|---|
| `patients_patient` | B-Tree Unique | `mrn` | Instant patient lookup by Medical Record Number |
| `patients_patient` | B-Tree Composite | `last_name, first_name` | Autocomplete and patient directory sorting |
| `clinical_clinicalrecord`| B-Tree Composite | `patient_id, recorded_at DESC`| Rapid retrieval of the patient's latest vital signs encounter |
| `predictions_prediction` | B-Tree Composite | `patient_id, created_at DESC` | Longitudinal patient risk trajectory queries |
| `predictions_prediction` | B-Tree Index | `prediction_result` | Rapid aggregation of dashboard risk counters (e.g. total High Risk) |
| `reports_report` | B-Tree Composite | `patient_id, status` | Listing downloadable completed reports for a patient |
| `core_auditlog` | B-Tree Composite | `resource_type, resource_id`| Fast audit trail lookup for a specific prediction or patient |
""")

    write_file("database/migrations.md", """
# Database Migrations Workflow

Django manages schema evolution through the `python manage.py migrate` framework.

---

## 1. Safe Production Migration Rules

1. **Direct Connection:** Always execute migrations using the unpooled direct endpoint (`DIRECT_DATABASE_URL`), as PgBouncer connection pools do not support transactional DDL.
2. **Backward-Compatible Alterations:** When adding new columns, always define them as nullable (`null=True`) or with safe database defaults.
3. **Branch-First Migration Validation:**
   - Create a temporary Neon branch from production.
   - Execute `python manage.py migrate` on the branch.
   - Verify application smoke tests pass.
   - Apply migrations to the primary production branch.
""")

    write_file("database/backup-recovery.md", """
# Database Backup & Disaster Recovery (Neon PITR)

Neon Serverless PostgreSQL incorporates automated continuous Write-Ahead Log (WAL) archiving and Point-In-Time Recovery (PITR).

---

## 1. Service Level Objectives

- **Recovery Point Objective (RPO):** < 5 minutes.
- **Recovery Time Objective (RTO):** < 15 minutes.

---

## 2. Recovery Procedures

### Point-In-Time Recovery (PITR)
Neon retains WAL logs up to the configured retention window (e.g., 7 days in production). If data corruption occurs:
1. Identify the target UTC timestamp immediately preceding the incident: `2026-09-13T14:32:00Z`.
2. Create a new branch via Neon Console or Neon CLI:
   ```bash
   neon branches create --from-timestamp "2026-09-13T14:32:00Z" --name recovery-branch
   ```
3. Update `DATABASE_URL` in the application cluster to point to the restored branch endpoint.
4. Restart application containers to resume traffic.
""")

    # =============================================================
    # docs/api/ (11 files)
    # =============================================================
    write_file("api/overview.md", """
# REST API Overview & Conventions

The PatientRisk CDSS API follows RESTful architecture principles, versioned under `/api/v1/`.

---

## 1. Standard Response Envelope

All endpoints return a uniform envelope structure:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-13T16:00:00.000Z"
  }
}
```

### Asynchronous Queued Response (`202 Accepted`)
```json
{
  "success": true,
  "data": {
    "task_id": "c67c29de-dc33-48d4-8632-d13955d24ea4",
    "status": "QUEUED",
    "message": "Report generation enqueued successfully."
  }
}
```

### Error Response (`4xx`, `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Measurement out of acceptable clinical range.",
    "details": {
      "heart_rate": ["Heart rate must be between 20 and 300 bpm."]
    }
  }
}
```
""")

    write_file("api/authentication.md", """
# Authentication API

Endpoints for user registration, JWT token acquisition, refresh, and logout.

---

## 1. Endpoints

### 1.1 `POST /api/v1/auth/register/`
Registers a new clinical user.
- **Request Body:**
  ```json
  {
    "email": "dr.elena@hospital.org",
    "username": "dr_elena",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "first_name": "Elena",
    "last_name": "Vance",
    "role": "DOCTOR",
    "department": "Cardiology",
    "phone_number": "+15551234"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "dr.elena@hospital.org", "role": "DOCTOR" },
      "tokens": { "access": "jwt...", "refresh": "jwt..." }
    }
  }
  ```

### 1.2 `POST /api/v1/auth/login/` (or `POST /api/v1/auth/token/`)
Authenticates existing clinician.
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Response (200 OK):** `{ "success": true, "data": { "access": "...", "refresh": "..." } }`

### 1.3 `POST /api/v1/auth/token/refresh/`
Rotates access token using a valid refresh token.
""")

    write_file("api/patients.md", """
# Patients API

Endpoints for managing patient demographic records.

---

## 1. Endpoints

### 1.1 `GET /api/v1/patients/`
List admitted patients with pagination, search, and sorting.
- **Query Parameters:**
  - `search`: Search by full name or MRN.
  - `page`: Page index (default: `1`).
  - `page_size`: Records per page (default: `20`).

### 1.2 `POST /api/v1/patients/`
Create a new patient demographic record.
- **Request Body:**
  ```json
  {
    "first_name": "Eleanor",
    "last_name": "Ward",
    "date_of_birth": "1958-04-12",
    "gender": "FEMALE",
    "blood_group": "A+",
    "phone_number": "+15551234567",
    "email": "eleanor.ward@patient.org",
    "address": "452 Medical Parkway, Suite 100"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid",
    "mrn": "MRN-2026-0814",
    "first_name": "Eleanor",
    "last_name": "Ward",
    "gender": "FEMALE"
  }
  ```

### 1.3 `GET /api/v1/patients/{id}/`
Retrieve patient profile details and assigned primary physician.

### 1.4 `DELETE /api/v1/patients/{id}/`
Soft delete patient record (sets `is_deleted = true`).
""")

    write_file("api/clinical-records.md", """
# Clinical Records API

Endpoints for recording and retrieving serial clinical encounters and vital sign measurements.

---

## 1. Endpoints

### 1.1 `POST /api/v1/patients/{patient_id}/clinical-records/`
Record a new clinical vital observation encounter.
- **Request Body:**
  ```json
  {
    "encounter_type": "EMERGENCY",
    "systolic_bp": 172.0,
    "diastolic_bp": 104.0,
    "heart_rate": 118,
    "respiratory_rate": 26,
    "oxygen_saturation": 89.0,
    "body_temperature": 37.6,
    "glucose_level": 184.0,
    "cholesterol_total": 284.0,
    "bmi": 29.4,
    "creatinine": 1.45,
    "sodium": 138.0,
    "potassium": 4.2,
    "chief_complaint": "Acute retrosternal chest pain radiating to jaw",
    "clinical_notes": "Continuous bedside telemetry initiated in ICU-Bed-04."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid",
    "patient": "uuid",
    "encounter_type": "EMERGENCY",
    "systolic_bp": 172.0,
    "heart_rate": 118,
    "recorded_at": "2026-09-13T16:15:00Z"
  }
  ```

### 1.2 `GET /api/v1/patients/{patient_id}/clinical-records/`
Retrieve longitudinal timeline of vital sign encounters for a patient.
""")

    write_file("api/predictions.md", """
# Predictions API

Endpoints for real-time machine learning inference, explainability, batch predictions, and clinical overrides.

---

## 1. Endpoints

### 1.1 `POST /api/v1/predictions/`
Request real-time clinical risk inference for a patient encounter.
- **Request Body:**
  ```json
  {
    "patient_id": "3500a9c4-dd95-48c2-af3b-7913285b9158"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "c67c29de-dc33-48d4-8632-d13955d24ea4",
    "patient": "3500a9c4-dd95-48c2-af3b-7913285b9158",
    "prediction_result": "HIGH",
    "probability": 0.8420,
    "confidence_score": 0.8420,
    "inference_latency_ms": 1.45,
    "explanation": {
      "baseline_value": 0.248,
      "features": [
        {
          "feature": "systolic_bp",
          "attribution": 0.182,
          "direction": "INCREASES_RISK",
          "clinical_description": "Elevated systolic blood pressure (172 mmHg) increases cardiovascular risk."
        }
      ],
      "disclaimer": "This is a MODEL EXPLANATION, not a medical diagnosis."
    }
  }
  ```

### 1.2 `GET /api/v1/predictions/{id}/explanation/`
Retrieve detailed SHAP factor waterfall for an existing prediction.

### 1.3 `POST /api/v1/predictions/{id}/override/`
Record an attending physician's clinical override of the automated risk level.
- **Request Body:**
  ```json
  {
    "clinician_override": "CRITICAL",
    "override_reason": "Patient shows refractory tachypnea and impending hemodynamic collapse."
  }
  ```

### 1.4 `POST /api/v1/predictions/batch/`
Submit a vectorized array of observations for high-throughput batch evaluation.
""")

    write_file("api/models.md", """
# Model Registry API

Endpoints for monitoring model versions, promotion, and performance telemetry.

---

## 1. Endpoints

### 1.1 `GET /api/v1/models/`
Lists all registered ML models with status (`ACTIVE`, `CANDIDATE`, `ARCHIVED`) and benchmark accuracy.

### 1.2 `POST /api/v1/models/{id}/promote/`
Promotes a model version to `ACTIVE`, automatically invalidating the in-memory cache on web workers. Requires `ADMIN` privileges.
""")

    write_file("api/reports.md", """
# Reports API

Endpoints for asynchronous PDF medical report generation and secure streaming downloads.

---

## 1. Endpoints

### 1.1 `POST /api/v1/reports/`
Enqueues asynchronous PDF report compilation. Returns immediately without blocking the HTTP worker.
- **Request Body:**
  ```json
  {
    "patient_id": "uuid",
    "prediction_id": "uuid",
    "report_type": "DISCHARGE_SUMMARY",
    "format": "PDF"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "task_id": "f519a64c-7df3-413d-b8dd-2e8b00b0541f",
    "report_id": "e4b176cb-a93d-4fe1-9128-552383a071f2",
    "status": "QUEUED",
    "message": "Report generation enqueued successfully."
  }
  ```

### 1.2 `GET /api/v1/reports/{id}/`
Poll report status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).

### 1.3 `GET /api/v1/reports/{id}/download/`
Streams the compiled ReportLab PDF document with `Content-Type: application/pdf`.
""")

    write_file("api/notifications.md", """
# Notifications API

Endpoints for managing clinical alerts and emergency triage notifications.

---

## 1. Endpoints

### 1.1 `GET /api/v1/notifications/`
Lists alerts for the authenticated clinician, filterable by `is_read=false` and `severity=CRITICAL`.

### 1.2 `POST /api/v1/notifications/{id}/read/`
Marks a specific emergency notification as acknowledged.
""")

    write_file("api/dashboard.md", """
# Dashboard & Health Telemetry API

Endpoints for real-time dashboard aggregation and operational health metrics.

---

## 1. Endpoints

### 1.1 `GET /api/v1/health/`
Liveness probe returning `{ "status": "healthy" }`.

### 1.2 `GET /api/v1/health/metrics/`
Operational metrics registry returning API latency percentiles, error counts, active WebSocket connections, and database query timings.

### 1.3 `GET /api/v1/health/db/`
PostgreSQL connectivity probe.

### 1.4 `GET /api/v1/health/redis/`
Redis round-trip ping probe.

### 1.5 `GET /api/v1/health/celery/`
Celery background worker queue health probe.
""")

    write_file("api/audit.md", """
# Audit Log API

Endpoints for compliance and security audit trails.

---

## 1. Endpoints

### 1.1 `GET /api/v1/audit/`
Retrieves immutable audit entries (resource type, user ID, IP address, timestamp, metadata diff). Requires `ADMIN` privileges.
""")

    write_file("api/websocket-api.md", """
# WebSocket API Protocol

Specifications for real-time WebSocket communication over `/ws/dashboard/` and `/ws/alerts/`.

---

## 1. Handshake & Authentication

Clinicians connect via:
`wss://cdss.hospital.org/ws/dashboard/?token=<access_jwt>`

The ASGI `JwtAuthMiddleware` extracts the token from query parameters, validates signature and expiration, and binds the authenticated `User` object to the connection `scope`.

---

## 2. Event Messages

### 2.1 `prediction_created`
Broadcast when a new prediction is persisted:
```json
{
  "type": "prediction_created",
  "payload": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_name": "Eleanor Ward",
    "risk_level": "HIGH",
    "probability": 0.842,
    "created_at": "2026-09-13T16:20:00Z"
  }
}
```

### 2.2 `task_status_updated`
Broadcast when a Celery background job changes state:
```json
{
  "type": "task_status_updated",
  "payload": {
    "task_id": "uuid",
    "task_name": "generate_pdf_report",
    "status": "COMPLETED",
    "progress": 100,
    "result": {
      "download_url": "/api/v1/reports/uuid/download/"
    }
  }
}
```
""")

    print("Generated database and API documentation.")


if __name__ == "__main__":
    generate()
