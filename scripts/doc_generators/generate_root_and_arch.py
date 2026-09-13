"""
Generator for root docs and docs/architecture/
"""
from pathlib import Path

DOCS_DIR = Path(r"c:\4-1\docs")


def write_file(rel_path: str, content: str):
    p = DOCS_DIR / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Created {rel_path} ({len(content)} chars)")


def generate():
    # -------------------------------------------------------------
    # docs/README.md
    # -------------------------------------------------------------
    write_file("README.md", """
# PatientRisk CDSS — Engineering Documentation Index

**Project Code:** BPY-CSE-2666  
**Project Title:** Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques  
**Application Name:** Patient Risk Level Prediction Using Machine Learning for Intelligent Clinical Decision Support (PatientRisk CDSS)  
**System Tagline:** Predict • Prevent • Support  

Welcome to the comprehensive technical documentation for the PatientRisk Clinical Decision Support System. This repository contains complete specifications, architectural diagrams, API schemas, machine learning pipeline blueprints, database models, real-time protocols, and deployment guides.

---

## 🧭 Documentation Navigation Index

### 1. Fundamentals & Architecture
* [01 - Project Overview](01-project-overview.md): Clinical problem statement, system objectives, intended clinical audience, clinical disclaimer, and high-level workflow.
* [02 - System Requirements](02-requirements.md): Functional and non-functional specifications, latency SLAs, regulatory & compliance boundaries.
* [03 - System Architecture](03-system-architecture.md): End-to-end multi-tier system topology, synchronous vs asynchronous data flows, and component interaction models.
* [04 - Technology Stack](04-technology-stack.md): Comprehensive inventory of frontend, backend, database, ML, real-time, and DevOps technologies.
* [05 - Project Structure](05-project-structure.md): Detailed directory tree walkthrough for `frontend/`, `backend/`, `ml/`, and `docker/`.

### 2. Deep-Dive Architecture Modules (`architecture/`)
* [Architecture Overview](architecture/overview.md): High-level system design principles (OOP, SOLID, DRY, modular design).
* [Frontend Architecture](architecture/frontend-architecture.md): Next.js App Router, SSR/CSR balance, Zustand state management, and real-time reactive hydration.
* [Backend Architecture](architecture/backend-architecture.md): Django ASGI core, service-repository layer pattern, and custom middleware pipeline.
* [Machine Learning Architecture](architecture/ml-architecture.md): Training pipeline, model serialization, runtime inference engine, and SHAP explainability layer.
* [Real-Time Architecture](architecture/realtime-architecture.md): Django Channels, Redis channel layers, WebSocket authentication, and room multiplexing.
* [Database Architecture](architecture/database-architecture.md): Neon Serverless PostgreSQL, branching strategy, connection pooling, and indexing.
* [Security Architecture](architecture/security-architecture.md): JWT lifecycle, clinical Role-Based Access Control (RBAC), audit logging, and HIPAA compliance posture.
* [Deployment Architecture](architecture/deployment-architecture.md): Multi-container Docker topology, Nginx reverse proxy, and zero-downtime rolling deploys.

### 3. Frontend Documentation (`frontend/`)
* [Frontend Overview](frontend/overview.md): UI philosophy, clinical dark-mode aesthetic, and feature architecture.
* [Frontend Setup](frontend/setup.md): Local development setup, Node.js runtime, environment variables, and build tools.
* [Frontend Architecture](frontend/architecture.md): Directory breakdown, routing patterns, and layout hierarchy.
* [Component Library](frontend/components.md): Design system tokens, reusable primitives (Button, Modal, Table, Select, Chart, etc.).
* [State Management](frontend/state-management.md): Zustand stores (`authStore`, `clinicalStore`) and optimistic UI mutations.
* [API Integration](frontend/api-integration.md): Centralized Axios client, JWT auto-refresh interceptors, and error handling.
* [WebSocket Integration](frontend/websocket-integration.md): Custom `useWebSocket` hook, reconnect backoff, and live event handlers.
* [UI/UX & Accessibility](frontend/ui-ux-guidelines.md): Typography, color palettes, micro-interactions, and accessibility standards.

### 4. Backend Documentation (`backend/`)
* [Backend Overview](backend/overview.md): Django REST Framework architecture and domain isolation.
* [Backend Setup](backend/setup.md): Virtual environment configuration, Poetry/Pip requirements, and database migrations.
* [Django Architecture](backend/django-architecture.md): ASGI/WSGI entrypoints, settings modularization, and app registry.
* [Apps & Domain Models](backend/apps.md): Deep-dive into `accounts`, `patients`, `clinical`, `predictions`, `model_registry`, `reports`, `notifications`.
* [Service Layer](backend/services.md): Business logic isolation, `PredictionService`, `ExplanationService`, `ReportService`.
* [Serializers](backend/serializers.md): Input validation, nested relations, and serialization performance.
* [Permissions & RBAC](backend/permissions.md): Custom DRF permission classes (`IsClinician`, `IsAdminUser`, `IsPatientOwner`).
* [Error Handling](backend/error-handling.md): Standardized API envelope (`{success, data, error}`), HTTP status codes, and exception handler.
* [Configuration & Settings](backend/configuration.md): Environment-driven configuration, database URLs, and logging profiles.

### 5. Database Documentation (`database/`)
* [Database Overview](database/overview.md): Relational design, data integrity, and foreign key cascades.
* [Neon PostgreSQL](database/neon-postgresql.md): Managed cloud Postgres setup, connection pooling, and cold-start mitigations.
* [Schema & ER Diagrams](database/schema.md): Complete Mermaid ER diagram covering all relational tables and enums.
* [Models Specification](database/models.md): Field-level documentation of all Django ORM entities.
* [Relationships](database/relationships.md): One-to-many, many-to-one, and one-to-one constraints.
* [Indexes & Optimization](database/indexes.md): B-Tree indexes, composite indexes, and query performance profiles.
* [Migrations](database/migrations.md): Safe migration workflows, schema-only testing, and rollback strategies.
* [Backup & Recovery](database/backup-recovery.md): Neon Point-In-Time Recovery (PITR), branching backups, and RTO/RPO targets.

### 6. REST & Real-Time API (`api/`)
* [API Overview](api/overview.md): Base URL, API versioning (`/api/v1/`), standard response envelope, and status codes.
* [Authentication API](api/authentication.md): Register, login, JWT token rotation, password reset, and user verification.
* [Patients API](api/patients.md): Patient registration, demographic updates, search, filtering, and soft-delete.
* [Clinical Records API](api/clinical-records.md): Vital signs recording, lab biomarker ingestion, and historical record retrieval.
* [Predictions API](api/predictions.md): Real-time risk prediction, batch prediction, clinician override, and audit history.
* [Model Registry API](api/models.md): Model versioning, active model promotion, performance telemetry, and artifact access.
* [Reports API](api/reports.md): Asynchronous PDF report dispatch (`202 Accepted`), status tracking, and file download.
* [Notifications API](api/notifications.md): Alert delivery, unread count tracking, and batch acknowledge endpoints.
* [Dashboard API](api/dashboard.md): Aggregate telemetry, risk distribution counters, and activity streams.
* [Audit Log API](api/audit.md): Immutable clinical action logging, change diffs, and security audit queries.
* [WebSocket API](api/websocket-api.md): Channels protocol, message format, subscription topics (`dashboard`, `risk_alerts`, `tasks`).

### 7. Machine Learning Pipeline (`ml/`)
* [ML Overview](ml/overview.md): Clinical problem framing, risk stratification taxonomy (Low, Medium, High, Critical).
* [Dataset](ml/dataset.md): UCI Heart Disease dataset, Cleveland clinic cohort, feature distributions, and demographic profiles.
* [Data Preprocessing](ml/data-preprocessing.md): Median/mode imputation, standard scaling, and categorical encoding.
* [Feature Engineering](ml/feature-engineering.md): Clinical interaction terms, cardiovascular ratios, and feature selection.
* [Model Training](ml/training.md): Cross-validation strategy, grid search hyperparameter tuning, and pipeline packaging.
* [Support Vector Machine](ml/svm.md): RBF kernel configuration, decision boundary analysis, and clinical trade-offs.
* [Random Forest](ml/random-forest.md): Ensemble tree mechanics, hyperparameter settings, and feature importance.
* [AdaBoost](ml/adaboost.md): Adaptive boosting implementation, weak learners, and sensitivity to noisy clinical vitals.
* [Model Evaluation](ml/model-evaluation.md): Confusion matrices, ROC-AUC, Precision-Recall curves, Brier score, and F1 benchmarks.
* [Model Selection](ml/model-selection.md): Comparative model bakeoff, clinical false-negative penalties, and production winner selection.
* [Model Versioning](ml/model-versioning.md): Model registry table, artifact hashing, semantic versioning, and activation protocol.
* [Runtime Inference](ml/inference.md): In-memory caching, sub-10ms inference execution, and vectorization.
* [Explainability (SHAP)](ml/explainability.md): TreeExplainer mechanics, baseline risk, feature attributions, and clinician disclaimers.
* [MLOps & Lifecycle](ml/mlops.md): Model retraining pipelines, data drift detection, and shadow deployment patterns.

### 8. Real-Time & Background Systems (`realtime/`, `background-jobs/`)
* [Real-Time Overview](realtime/overview.md): Asynchronous communication model, latency benefits, and fallback strategies.
* [Redis Infrastructure](realtime/redis.md): In-memory pub/sub, channel layer broker, and distributed lock engine.
* [Django Channels](realtime/django-channels.md): Protocol routers, ASGI event loops, and consumer implementations.
* [WebSockets](realtime/websockets.md): WebSocket lifecycle, connection keepalives, heartbeat pings, and teardown.
* [Real-Time Events](realtime/events.md): Event catalog (`prediction_created`, `risk_alert`, `task_status_updated`).
* [Real-Time Notifications](realtime/notifications.md): Targeted physician notifications, priority alert banners, and audible chimes.
* [Failure & Reconnect](realtime/failure-recovery.md): Exponential backoff reconnects, state resynchronization, and queue replay.
* [Celery Architecture](background-jobs/celery.md): Celery worker topology, Redis broker, and task result backend.
* [Background Tasks](background-jobs/tasks.md): ReportLab PDF compilation, bulk inference, email alerts, and scheduled analytics.
* [Task Retry Strategy](background-jobs/retries.md): Exponential backoff with jitter, soft/hard time limits, and idempotency locks.
* [Job Monitoring](background-jobs/monitoring.md): Task status polling endpoints, Celery Flower, and failure telemetry.

### 9. Security, Governance & Compliance (`security/`)
* [Security Overview](security/overview.md): Defense-in-depth principles, healthcare data security guidelines.
* [Authentication](security/authentication.md): Dual-token JWT (short-lived access, rolling refresh), brute-force throttling.
* [Authorization](security/authorization.md): Principle of least privilege, object-level ownership checks, and view-level guards.
* [Role-Based Access Control (RBAC)](security/rbac.md): Role taxonomy (Administrator, Clinician/Doctor, Nurse, Staff, Patient).
* [Data Protection](security/data-protection.md): Encryption in transit (TLS 1.3), encryption at rest, and secret sanitation.
* [API Security](security/api-security.md): CORS origins, CSRF trusted origins, rate limiting, and SQL injection prevention.
* [WebSocket Security](security/websocket-security.md): Query-param JWT verification during handshake, room access authorization.
* [Audit Logging](security/audit-logging.md): Relational audit trail, clinician override tracking, and HIPAA audit readiness.
* [Security Checklist](security/security-checklist.md): Production verification checklist for zero-trust deployment.

### 10. Testing & Quality Assurance (`testing/`)
* [Testing Overview](testing/overview.md): Test pyramid, automated test automation, and coverage metrics.
* [Backend Testing](testing/backend-testing.md): Pytest Django suite, fixtures, API test clients, and test database reuse.
* [Frontend Testing](testing/frontend-testing.md): TypeScript strict compilation, Next.js page generation, and component testing.
* [API Testing](testing/api-testing.md): REST endpoint verification, status code validation, and envelope assertions.
* [Database Testing](testing/database-testing.md): Constraint enforcement, soft deletion tests, and transaction rollback tests.
* [ML Testing](testing/ml-testing.md): Preprocessing determinism, prediction output boundary checks, and SHAP stability.
* [WebSocket Testing](testing/websocket-testing.md): Async consumer tests, group send verification, and connection reject tests.
* [End-to-End Integration Testing](testing/integration-testing.md): The full 15-step end-to-end integration test (`test_e2e_production_flow.py`).
* [Test Strategy & Performance](testing/test-strategy.md): Fast execution guidelines, bytecode tracing optimization, and CI automation.

### 11. Production Operations & Deployment (`deployment/`)
* [Deployment Overview](deployment/overview.md): Containerization strategy, cloud infrastructure requirements.
* [Local Development](deployment/local-development.md): Running the system with Docker Compose vs native development.
* [Docker Containers](deployment/docker.md): Multi-stage Dockerfiles, caching strategies, and non-root users.
* [Environment Variables](deployment/environment-variables.md): Complete catalog of `.env` configuration flags.
* [Production Deployment](deployment/production.md): Step-by-step production rollout guide, ASGI daemon setup.
* [Nginx Reverse Proxy](deployment/nginx.md): Configuration, WebSocket tunneling, TLS termination, and static file offloading.
* [CI/CD Pipeline](deployment/ci-cd.md): GitHub Actions 7-stage workflow breakdown and deployment gating.
* [Monitoring & Metrics](deployment/monitoring.md): In-memory telemetry, `/api/v1/health/metrics/`, structured JSON logs.
* [Troubleshooting Runbook](deployment/troubleshooting.md): Diagnosis guides for database disconnects, Redis stalls, and ML timeouts.

### 12. Development Lifecycle & Project Governance (`development/`, `project/`)
* [Getting Started](development/getting-started.md): Developer onboarding guide, repository checkout, and first boot.
* [Coding Standards](development/coding-standards.md): PEP 8, TypeScript strict mode, Tailwind CSS conventions, and commit formatting.
* [Git Workflow & Branching](development/git-workflow.md): Feature branching, PR templates, and semantic commits.
* [Pull Requests](development/pull-requests.md): Review guidelines, required CI checks, and merge policies.
* [Contribution Guide](development/contribution-guide.md): How to submit clinical features, algorithms, and bug fixes.
* [Roadmap](project/roadmap.md): Milestone progression from core prototype to production CDSS.
* [Changelog](project/changelog.md): Release history and version notes.
* [Known Limitations](project/known-limitations.md): Technical constraints, browser compatibility, and clinical caveats.
* [Future Enhancements](project/future-enhancements.md): EHR FHIR/HL7 integration, multi-modal imaging, and federated learning.
* [Glossary](project/glossary.md): Clinical and machine learning terminology.
""")

    # -------------------------------------------------------------
    # docs/01-project-overview.md
    # -------------------------------------------------------------
    write_file("01-project-overview.md", """
# 01. Project Overview

**Project Code:** BPY-CSE-2666  
**Project Title:** Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques  
**Application Name:** Patient Risk Level Prediction Using Machine Learning for Intelligent Clinical Decision Support (PatientRisk CDSS)  
**System Tagline:** Predict • Prevent • Support  

---

## 1. Problem Statement

Cardiovascular diseases (CVDs) remain the leading cause of mortality globally, accounting for an estimated 17.9 million deaths annually. In acute clinical environments—such as emergency triage units, intensive care units (ICUs), and cardiology outpatient wards—physicians and healthcare providers must rapidly synthesize multi-dimensional patient data, including:

- Physiological vital signs (blood pressure, heart rate, respiratory rate, oxygen saturation, temperature).
- Demographic variables (age, biological sex).
- Laboratory biomarkers and clinical measurements (blood glucose, total cholesterol, serum creatinine, electrolytes).
- Electrocardiographic (ECG) indicators (ST-segment depression, ST-T wave abnormalities, slope).
- Angiographic and exercise stress indicators (exercise-induced angina, fluoroscopy vessel coloration, thallium stress scintigraphy).

Traditional clinical assessment relies heavily on manual scoring systems (such as the Framingham Risk Score or TIMI score), which often suffer from:
1. **Coarse Linear Stratification:** Inability to capture complex, non-linear interactions between borderline multi-organ physiological indicators.
2. **Static Evaluations:** Lack of real-time adaptation to acute vital sign fluctuations observed during active hospitalization.
3. **Black-Box Skepticism:** Hesitancy among clinicians to adopt automated artificial intelligence tools when algorithmic reasoning is opaque.
4. **Disjointed Workflows:** Friction caused by legacy electronic health record (EHR) systems that lack instantaneous, zero-reload telemetry and automated asynchronous reporting.

---

## 2. Project Objectives

The **PatientRisk CDSS** project was designed and engineered to address these challenges by providing an intelligent, transparent, and responsive decision-support platform:

1. **Intelligent Risk Stratification:** Train, validate, and deploy supervised machine learning models (Support Vector Machines, Random Forest, AdaBoost) capable of stratifying patients into four standardized clinical risk tiers: **LOW**, **MEDIUM**, **HIGH**, and **CRITICAL**.
2. **Explainable AI (XAI):** Integrate TreeSHAP (SHapley Additive exPlanations) into the runtime prediction loop to provide clinicians with individualized factor attribution weights and natural language descriptions explaining *why* a particular risk level was assigned.
3. **Real-Time Telemetry:** Deliver sub-second updates to hospital dashboards via WebSocket connections backed by Django Channels and Redis, ensuring attending physicians are alerted immediately upon patient deterioration without manual page refreshes.
4. **Asynchronous Processing:** Offload resource-intensive workloads (ReportLab PDF medical summaries, batch predictions, cohort analytics) to dedicated Celery background workers.
5. **Physician Agency & Auditing:** Enforce a strict clinician override mechanism with immutable database audit trails, ensuring medical professionals always retain final diagnostic authority.

---

## 3. Clinical Decision-Support Disclaimer

> [!IMPORTANT]
> **LEGAL & CLINICAL PRACTICE NOTICE**  
> The PatientRisk Clinical Decision Support System is an **assistive diagnostic aid**, designed exclusively to augment the clinical judgment of qualified medical professionals. It is **NOT** an autonomous diagnostic system and does **NOT** substitute for professional clinical acumen, physical examinations, specialized laboratory testing, or physician consultation.  
> 
> All risk probabilities, factor attributions, and recommended workflows generated by this platform must be critically evaluated by licensed healthcare providers prior to initiating or altering patient treatment regimens.

---

## 4. Target User Personas

| Role | Taxonomy | Primary Responsibilities in System |
|---|---|---|
| **Attending Cardiologist / Physician** | `DOCTOR` / `CLINICIAN` | Reviews assigned patients, requests real-time AI risk predictions, inspects SHAP attributions, overrides automated risk scores with documented rationales, and generates discharge/transfer PDF summaries. |
| **Triage / Ward Nurse** | `NURSE` | Admits patients, logs serial vital sign encounters (blood pressure, heart rate, SpO2, blood glucose), and monitors real-time ward telemetry alerts. |
| **System Administrator** | `ADMIN` | Manages user accounts, configures institutional security policies, inspects system audit logs, monitors model versioning, and oversees server telemetry. |
| **Clinical Data Analyst** | `ANALYST` | Inspects cohort risk distributions, evaluates model accuracy and ROC-AUC metrics over time, and assesses calibration drift. |
| **Patient / Family Proxy** | `PATIENT` | Securely views personal medical profile, historical risk evaluations, and clinician-approved discharge summaries. |

---

## 5. End-to-End Clinical Workflow

The platform coordinates a 15-step clinical lifecycle across its frontend, backend, ML engine, and database tiers:

```
[1. Registration] ──> [2. JWT Login] ──> [3. Dashboard Telemetry]
                                                     │
[6. Prediction Req] <── [5. Add Vitals] <── [4. Admit Patient]
         │
         ▼
[7. Preprocessing] ──> [8. ML Ensemble] ──> [9. Risk Stratification]
                                                     │
[12. Redis Event] <── [11. Postgres Save] <── [10. SHAP Attribution]
         │
         ▼
[13. WebSocket Broadcast] ──> [14. Patient Audit Trail] ──> [15. PDF Discharge Report]
```

1. **User Registration:** Clinician signs up with institutional email, role, and department.
2. **Authentication:** Clinician authenticates using email and password, obtaining short-lived access JWT and refresh token.
3. **Dashboard Telemetry:** Application requests system health, active model version, and cohort risk statistics.
4. **Patient Admission:** Clinician admits a patient, capturing demographics (MRN, DOB, gender, blood group).
5. **Clinical Observation:** Clinical staff record vital signs (systolic/diastolic BP, HR, SpO2, glucose, cholesterol, creatinine).
6. **Prediction Request:** Clinician submits inference request for the patient encounter.
7. **ML Preprocessing:** Data pipeline applies median imputation and standard scaling.
8. **Ensemble Inference:** Active model (Random Forest / Gradient Boosting) executes inference in sub-10ms.
9. **Risk Result:** System maps continuous probability to discrete clinical categories (LOW, MEDIUM, HIGH, CRITICAL).
10. **SHAP Factor Attribution:** Engine computes SHAP values to identify top positive and protective risk factors.
11. **PostgreSQL Persistence:** Complete prediction record, confidence score, and feature snapshot are saved to Neon DB.
12. **Redis Event Dispatch:** Django publishes a structured event payload to the Redis Channel Layer.
13. **WebSocket Broadcast:** ASGI consumer pushes the event to connected clinician browser sessions.
14. **Audit History:** Physician reviews historical risk trajectory and overrides risk if clinically warranted.
15. **Report Compilation:** Clinician requests a discharge summary; Celery worker compiles a styled ReportLab PDF and dispatches a completion alert.
""")

    # -------------------------------------------------------------
    # docs/02-requirements.md
    # -------------------------------------------------------------
    write_file("02-requirements.md", """
# 02. System Requirements & Specifications

This document outlines the functional, non-functional, clinical, and regulatory requirements governing the PatientRisk Clinical Decision Support System.

---

## 1. Functional Requirements

### 1.1 Authentication & Access Control (FR-AUTH)
- **FR-AUTH-01:** The system shall support user registration with email, password, clinical role, department, and telephone number.
- **FR-AUTH-02:** The system shall authenticate users via JSON Web Tokens (JWT), issuing access tokens (15-minute lifespan) and refresh tokens (7-day lifespan).
- **FR-AUTH-03:** The system shall enforce Role-Based Access Control (RBAC) across five roles: `ADMIN`, `DOCTOR`/`CLINICIAN`, `NURSE`, `ANALYST`, and `PATIENT`.
- **FR-AUTH-04:** The system shall restrict patient medical record access so that patients can only retrieve their own records, while clinicians access authorized departmental patients.

### 1.2 Patient & Clinical Record Management (FR-PAT)
- **FR-PAT-01:** The system shall maintain patient master demographic records including Medical Record Number (MRN), full name, date of birth, biological sex, and blood group.
- **FR-PAT-02:** The system shall support serial clinical observation encounters containing vital signs (systolic/diastolic BP, HR, RR, SpO2, body temperature) and laboratory values (glucose, cholesterol, creatinine, sodium, potassium).
- **FR-PAT-03:** The system shall validate physiological ranges upon input (e.g., systolic BP between 50 and 300 mmHg) and reject out-of-bounds measurements with HTTP 422 Unprocessable Entity.
- **FR-PAT-04:** The system shall enforce soft deletion on patient and clinical records to preserve longitudinal medical audit integrity.

### 1.3 Machine Learning Inference & Explainability (FR-ML)
- **FR-ML-01:** The system shall execute real-time inference using pre-trained and registered scikit-learn models (SVM, Random Forest, AdaBoost).
- **FR-ML-02:** The system shall classify patient risk into four discrete categories:
  - **LOW Risk:** Probability < 0.30
  - **MEDIUM Risk:** 0.30 <= Probability < 0.60
  - **HIGH Risk:** 0.60 <= Probability < 0.85
  - **CRITICAL Risk:** Probability >= 0.85
- **FR-ML-03:** The system shall compute TreeSHAP feature attributions for every prediction, identifying the top clinical factors elevating or lowering patient risk.
- **FR-ML-04:** The system shall allow attending physicians to record a clinical override of the automated risk level, requiring a mandatory textual clinical justification.

### 1.4 Real-Time Telemetry & Background Processing (FR-RT)
- **FR-RT-01:** The system shall maintain persistent WebSocket connections for active clinician sessions.
- **FR-RT-02:** The system shall broadcast new predictions to connected dashboard clients without requiring page refreshes.
- **FR-RT-03:** The system shall offload PDF report compilation to asynchronous Celery workers, returning an immediate HTTP 202 Accepted response with a task ID.
- **FR-RT-04:** The system shall notify the requesting clinician via WebSocket when asynchronous tasks transition through `PROCESSING`, `COMPLETED`, or `FAILED` states.

---

## 2. Non-Functional Requirements

### 2.1 Performance & Latency SLAs (NFR-PERF)
| Metric | Threshold SLA | Observed Benchmark |
|---|---|---|
| **ML Inference Latency** | < 50 ms | 1.45 ms – 8.2 ms |
| **API Response Time (CRUD)** | < 250 ms (p95) | 12 ms – 45 ms |
| **WebSocket Broadcast Latency** | < 100 ms | 5 ms – 20 ms |
| **PDF Report Compilation** | < 5.0 seconds | 2.6 seconds |
| **Frontend Static Route Prerender** | < 1.0 second | ~ 600 ms |

### 2.2 Reliability & Availability (NFR-REL)
- **High Availability:** Cloud deployment ready for 99.9% uptime.
- **Database Durability:** Managed Neon Cloud PostgreSQL with automated Write-Ahead Log (WAL) archiving and Point-In-Time Recovery (PITR).
- **Graceful Degradation:** In the event of WebSocket connection interruption, the frontend falls back to periodic REST polling and automatically attempts exponential backoff reconnection.

### 2.3 Security & Regulatory Standards (NFR-SEC)
- **HIPAA Alignment:** Passwords hashed with PBKDF2 with SHA-256; JWTs signed with secret keys stored in environment variables; zero cleartext credential storage.
- **Audit Logging:** Every prediction, clinical override, and patient modification is recorded in an append-only `AuditLog` table capturing timestamp, user ID, IP address, and JSON diff.
- **Transport Encryption:** Mandatory TLS 1.3 / HTTPS for all HTTP and WSS traffic.

---

## 3. System Constraints

1. **Production Database:** Neon PostgreSQL is the designated production database. Under no circumstances should PostgreSQL run as a local container in production.
2. **Asynchronous Workloads:** Synchronous HTTP requests must never perform blocking PDF rendering or bulk evaluations; Celery must be utilized.
3. **Non-Root Execution:** All Docker containers (`backend`, `frontend`, `worker`) must execute under unprivileged user accounts (`appuser`, `nextjs`).
""")

    # -------------------------------------------------------------
    # docs/03-system-architecture.md
    # -------------------------------------------------------------
    write_file("03-system-architecture.md", """
# 03. System Architecture

This document describes the end-to-end system architecture of the PatientRisk Clinical Decision Support System, explaining component boundaries, data pathways, and execution paradigms.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientTier ["Client Tier (Browser / Hospital Workstation)"]
        UI["Next.js 16 App Router (React 19 / TypeScript)"]
        WSClient["WebSocket Client (useWebSocket Hook)"]
        Store["Zustand State Stores (authStore, clinicalStore)"]
    end

    subgraph IngressTier ["Ingress & Reverse Proxy Tier"]
        Nginx["Nginx Reverse Proxy (SSL / TLS Termination, Port 80/443)"]
    end

    subgraph ApplicationTier ["Application & Service Tier (Docker)"]
        ASGI["Daphne ASGI Server (Port 8000)"]
        DRF["Django REST Framework API (/api/v1/)"]
        Channels["Django Channels (ASGI Consumers)"]
        ServiceLayer["Domain Services (PredictionService, ExplanationService)"]
        RepoLayer["Repository Layer (DjangoPredictionRepository)"]
        MetricsEngine["Metrics & Observability Registry"]
    end

    subgraph AsyncTier ["Asynchronous Worker Tier (Docker)"]
        CeleryWorker["Celery Worker (ReportLab PDF, Bulk ML Jobs)"]
        CeleryBeat["Celery Beat Scheduler (Periodic Analytics)"]
    end

    subgraph RealTimeBroker ["Message & Cache Tier (Docker)"]
        Redis["Redis 7 (Channel Layer Broker, Celery Broker, Locks)"]
    end

    subgraph MLTier ["Machine Learning Engine"]
        Loader["ModelLoaderService (Thread-Safe In-Memory Cache)"]
        Pipeline["scikit-learn Preprocessing & Inference Pipelines"]
        SHAP["SHAP Explainability Engine (TreeExplainer)"]
        ModelRegistry["Model Registry Storage (ml/artifacts/models/)"]
    end

    subgraph DataTier ["Cloud Managed Data Tier"]
        NeonDB[("Neon Serverless PostgreSQL\n(Pooled / Direct Endpoints)")]
    end

    %% Client communication
    UI -->|HTTPS REST Requests| Nginx
    WSClient <-->|WSS WebSockets| Nginx

    %% Ingress routing
    Nginx -->|Proxy HTTP /api/| ASGI
    Nginx -->|Proxy WS /ws/| ASGI
    Nginx -->|Proxy SSR Pages| UI

    %% App internal flow
    ASGI --> DRF
    ASGI --> Channels
    DRF --> ServiceLayer
    Channels <--> Redis
    ServiceLayer --> RepoLayer
    ServiceLayer --> Loader
    Loader --> Pipeline
    Pipeline --> SHAP
    ModelRegistry -.-> Loader
    RepoLayer <--> NeonDB

    %% Real-time and background interactions
    ServiceLayer -->|Publish Prediction Events| Redis
    ServiceLayer -->|Enqueue Async Reports| Redis
    Redis --> CeleryWorker
    CeleryBeat --> Redis
    CeleryWorker -->|Compile PDF & Update Status| NeonDB
    CeleryWorker -->|Broadcast Completion Event| Redis
    Redis --> Channels
    Channels -->|Push Live Alert| WSClient
    WSClient --> Store
    Store --> UI
```

---

## 2. Component Descriptions

### 2.1 Frontend Client Tier
- Built with **Next.js 16 (App Router)** and **React 19** in strict **TypeScript**.
- Styled with modern **Vanilla Tailwind CSS**, implementing an institutional clinical dark-mode aesthetic with custom color-coded risk tokens (`emerald`, `amber`, `rose`, `purple`).
- Uses **Zustand** stores (`authStore`, `clinicalStore`) to manage reactive state without unnecessary re-renders.
- Includes a resilient WebSocket connection hook with exponential backoff reconnect logic.

### 2.2 Ingress & Reverse Proxy (Nginx)
- Terminates TLS/HTTPS connections with modern cipher suites.
- Performs WebSocket header translation (`Upgrade $http_upgrade`, `Connection "upgrade"`).
- Directly serves pre-compiled static assets with 30-day cache headers, bypassing the Python ASGI application.
- Applies strict HTTP security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and restrictive `Content-Security-Policy`.

### 2.3 Application Tier (Django & Daphne ASGI)
- Serves both synchronous REST endpoints (`/api/v1/`) and asynchronous WebSocket consumers (`/ws/dashboard/`, `/ws/alerts/`).
- Follows a strict **Service Layer Pattern**: controllers/views validate parameters and delegate domain logic to specialized service classes (`PredictionService`, `ExplanationService`).
- Uses a **Repository Pattern** (`DjangoPredictionRepository`) to abstract ORM data fetching, ensuring loose coupling and testability.

### 2.4 Machine Learning Engine
- Features an active in-memory cache managed by `ModelLoaderService` to avoid expensive disk I/O on every inference request.
- Combines feature imputation, standard scaling, and scikit-learn models into serialized joblib pipelines.
- Embeds SHAP TreeExplainer to calculate exact additive contributions for every vital sign and clinical biomarker.

### 2.5 Real-Time & Background Infrastructure (Redis & Celery)
- **Redis:** Operates as the centralized message broker for Celery queues, the distributed result backend, the Django Channels channel layer, and distributed idempotency locking.
- **Celery Worker:** Executes long-running tasks asynchronously (PDF discharge summaries, model retraining jobs, bulk predictions) with idempotency locks preventing duplicate runs.

### 2.6 Managed Cloud Database (Neon PostgreSQL)
- Cloud-native serverless PostgreSQL utilizing separate endpoints:
  - **Pooled Endpoint (`-pooler`):** Utilized by high-concurrency web requests via PgBouncer.
  - **Direct Endpoint:** Utilized for schema migrations (`migrate`) and DDL operations.
""")

    # -------------------------------------------------------------
    # docs/04-technology-stack.md
    # -------------------------------------------------------------
    write_file("04-technology-stack.md", """
# 04. Technology Stack Inventory

This document details the complete technology stack powering the PatientRisk Clinical Decision Support System, including exact package versions, roles, and rationales.

---

## 1. Technology Matrix

| Layer | Technology | Version | Purpose in Application |
|---|---|---|---|
| **Frontend Framework** | Next.js | `16.3.5` | React application framework with App Router, SSR, and standalone build runner |
| **UI Library** | React | `19.0.0` | Declarative component UI rendering |
| **Language (Frontend)** | TypeScript | `^5.0.0` | Type safety, clinical schema enforcement, and compilation safety |
| **Styling** | Tailwind CSS | `^3.4.1` | Utility-first styling with custom clinical color tokens and responsive grid |
| **Icons** | Lucide React | `^0.475.0` | Modern SVG clinical and interface icons |
| **State Management** | Zustand | `^5.0.3` | Lightweight client state stores (`authStore`, `clinicalStore`) |
| **HTTP Client** | Axios | `^1.7.9` | REST API requests with request/response interceptors for JWT rotation |
| **Backend Framework** | Django | `5.0.14` | High-level Python web framework, ORM, and migration engine |
| **API Framework** | Django REST Framework | `3.15.2` | RESTful API serialization, viewsets, and permission controllers |
| **ASGI Server** | Daphne | `4.1.2` | Twisted-based ASGI server for concurrent HTTP and WebSocket connections |
| **Real-Time Channels** | Django Channels | `4.1.0` | WebSocket routing, connection lifecycles, and room multiplexing |
| **Channel Layer** | channels-redis | `4.2.0` | Redis-backed channel layer for cross-worker event broadcasting |
| **Background Queue** | Celery | `5.4.0` | Asynchronous task queue for long-running computational jobs |
| **Database** | Neon PostgreSQL | `16` (Cloud) | Serverless PostgreSQL with auto-scaling, branching, and connection pooling |
| **DB Driver** | psycopg2-binary | `2.9.10` | High-performance PostgreSQL database adapter for Python |
| **In-Memory Cache** | Redis | `7-Alpine` | Channel layer broker, Celery queue broker, and distributed lock engine |
| **Redis Client** | redis-py | `5.2.1` | Python interface to Redis |
| **ML Libraries** | scikit-learn | `1.6.1` | Machine learning modeling (SVM, Random Forest, AdaBoost) |
| **Explainable AI** | SHAP | `0.46.0` | TreeSHAP calculation for feature factor attribution |
| **Data Processing** | NumPy & Pandas | `2.2.3` / `2.2.3`| Numerical computations, dataframes, and matrix operations |
| **Model Persistence** | joblib | `1.4.2` | High-throughput pipeline serialization and deserialization |
| **PDF Generation** | ReportLab | `4.3.1` | Programmatic clinical PDF summary compilation |
| **Reverse Proxy** | Nginx | `1.25-Alpine` | Reverse proxy, static asset caching, and TLS termination |
| **Container Engine** | Docker & Compose | `24+` / `v2+` | Containerization of frontend, backend, worker, and Redis services |

---

## 2. Selection Rationale

### Why Next.js 16 & React 19?
Next.js provides a unified App Router architecture where static pages (landing, documentation, sign-in) are prerendered for instant first-contentful-paint (FCP), while dynamic authenticated patient dashboards use client-side hydration for zero-reload WebSocket event streaming.

### Why Daphne ASGI instead of standard WSGI?
Traditional WSGI servers (e.g., standard Gunicorn sync workers) block threads on long-lived connections, making WebSockets prohibitively expensive. Daphne natively handles asynchronous ASGI event loops, allowing thousands of simultaneous hospital WebSocket subscriptions while serving standard REST HTTP traffic.

### Why Neon Serverless PostgreSQL?
Neon separates storage and compute, enabling instant database branching for safe migration dry-runs, automatic scale-to-zero when idle in testing, and built-in connection pooling via PgBouncer to prevent connection exhaustion during concurrent clinical traffic.
""")

    # -------------------------------------------------------------
    # docs/05-project-structure.md
    # -------------------------------------------------------------
    write_file("05-project-structure.md", """
# 05. Project Directory Structure

This document provides an exhaustive breakdown of the project directory layout, explaining the purpose of each key file and module.

---

## 1. High-Level Workspace Layout

```
c:\4-1\
├── .github/                      # GitHub Actions CI/CD workflows
│   └── workflows/
│       └── ci-cd.yml             # 7-stage automated CI/CD pipeline
├── backend/                      # Django ASGI REST backend & services
├── frontend/                     # Next.js 16 TypeScript web application
├── ml/                           # Standalone ML training, artifacts, & evaluation
├── docker/                       # Infrastructure configuration (Nginx configs, etc.)
├── docs/                         # Comprehensive engineering documentation
├── scripts/                      # Deployment and maintenance scripts
├── docker-compose.yml            # Multi-container local development orchestration
├── .env.example                  # Sanitized production environment variable template
├── Makefile                      # Common developer command shortcuts
└── README.md                     # Root project overview
```

---

## 2. Backend Layout (`backend/`)

```
backend/
├── manage.py                     # Django CLI administrative entrypoint
├── pytest.ini                    # Pytest test runner configuration
├── requirements.txt              # Production Python dependencies
├── Dockerfile                    # Multi-stage Python 3.13 production container
│
├── config/                       # Core Django project configuration
│   ├── __init__.py
│   ├── asgi.py                   # ASGI application entrypoint (HTTP + WebSockets)
│   ├── wsgi.py                   # WSGI fallback entrypoint
│   ├── celery.py                 # Celery app initialization, base tasks & locks
│   ├── logging.py                # StructuredJsonFormatter for log aggregation
│   └── settings/
│       ├── __init__.py
│       ├── base.py               # Shared settings (apps, middleware, DRF, JWT)
│       ├── development.py        # Local development overrides
│       └── production.py         # Production security & Neon DB configuration
│
├── apps/                         # Modular Django applications
│   ├── accounts/                 # User authentication, User model, JWT views, RBAC
│   ├── patients/                 # Patient demographics master model & views
│   ├── clinical/                 # Serial clinical encounters & vital signs records
│   ├── predictions/              # Prediction model, explainability, REST views
│   ├── model_registry/           # ModelVersion metadata, accuracy tracking, status
│   ├── reports/                  # Report entity, Celery PDF compilation tasks
│   ├── notifications/            # Notification alerts entity & delivery tasks
│   └── core/                     # Base models, middleware, metrics registry
│
├── channels_app/                 # Real-time WebSocket routing & consumers
│   ├── consumers.py              # DashboardConsumer, AlertConsumer, PatientConsumer
│   ├── routing.py                # WebSocket URL route definitions
│   ├── middleware.py             # JWT authentication middleware for WebSocket scopes
│   └── events.py                 # Standardized WebSocket event dataclasses
│
├── celery_tasks/                 # Specialized asynchronous worker modules
│   ├── report_tasks.py           # ReportLab PDF compilation
│   ├── ml_tasks.py               # Bulk inference & periodic model evaluation
│   ├── notification_tasks.py     # Email delivery & multi-channel alerts
│   └── scheduled_tasks.py        # Celery Beat scheduled analytics jobs
│
├── services/                     # Business logic service layer (decoupled from views)
│   ├── prediction_service.py     # Prediction orchestration & event publishing
│   ├── explanation_service.py    # SHAP extraction & clinical factor mapping
│   ├── model_loader.py           # In-memory cached model loading
│   └── risk_engine.py            # OOP clinical threshold scoring & validation
│
├── repositories/                 # Data access layer
│   └── prediction_repository.py  # Abstraction for fetching patient & encounter vitals
│
└── tests/                        # Comprehensive test suite
    ├── test_auth.py              # User registration, login, and JWT tests
    ├── test_patient_management.py# Patient & clinical vitals CRUD tests
    ├── test_predictions.py       # Inference, override, and API tests
    ├── test_ml_pipeline.py       # Preprocessing and model artifact tests
    ├── test_explainable_ml.py    # SHAP stability and factor description tests
    ├── test_websockets.py        # WebSocket channel consumer tests
    ├── test_celery_tasks.py      # Background worker and PDF generation tests
    └── test_e2e_production_flow.py # Complete 15-step production lifecycle test
```

---

## 3. Frontend Layout (`frontend/`)

```
frontend/
├── package.json                  # Dependencies and scripts (dev, build, lint)
├── tsconfig.json                 # Strict TypeScript compiler options
├── next.config.ts                # Next.js configuration (standalone output mode)
├── tailwind.config.ts            # Clinical theme tokens, font families, keyframes
├── Dockerfile                    # Multi-stage Node.js 20 Alpine container
│
├── public/                       # Static public assets
│   ├── logo.png                  # High-resolution PatientRisk brand logo
│   └── icon.png                  # Brand favicon & PWA icon
│
└── src/
    ├── app/                      # Next.js App Router pages
    │   ├── layout.tsx            # Root layout with Geist fonts & SEO metadata
    │   ├── page.tsx              # Public landing page with hero brand emblem
    │   ├── icon.png              # App Router automated favicon
    │   ├── login/page.tsx        # Clinician authentication & 1-click persona demo
    │   ├── register/page.tsx     # Staff registration page
    │   ├── forgot-password/      # Password recovery page
    │   ├── dashboard/page.tsx    # Real-time clinical telemetry command center
    │   ├── patients/             # Patient directory & admission forms
    │   │   ├── page.tsx          # Patient directory table with search & filter
    │   │   └── [id]/page.tsx     # Individual patient longitudinal record
    │   ├── clinical/new/page.tsx # Vital signs & encounter observation form
    │   ├── predictions/          # Risk inference pages
    │   │   ├── page.tsx          # Prediction history table
    │   │   ├── new/page.tsx      # Interactive risk inference submission form
    │   │   └── [id]/page.tsx     # SHAP factor waterfall & clinician override
    │   ├── reports/page.tsx      # Discharge summaries & PDF download center
    │   ├── notifications/page.tsx# Real-time triage alert center
    │   ├── profile/page.tsx      # Clinician profile & institutional credentials
    │   └── admin/models/page.tsx # ML model registry & telemetry management
    │
    ├── components/
    │   ├── layout/
    │   │   └── Shell.tsx         # Primary responsive application shell & sidebar
    │   └── ui/                   # Reusable UI component library
    │       ├── button.tsx        # Styled button with loading spinners
    │       ├── badge.tsx         # Clinical risk badges (LOW, MED, HIGH, CRITICAL)
    │       ├── card.tsx          # Glassmorphism container cards
    │       ├── modal.tsx         # Accessible modal dialogues
    │       ├── table.tsx         # Paginated clinical data tables
    │       ├── select.tsx        # Form select controls
    │       ├── input.tsx         # Form inputs with validation error states
    │       ├── alert.tsx         # Priority alert banners
    │       ├── chart.tsx         # Responsive SVG / Canvas metric charts
    │       ├── loading.tsx       # Skeleton loaders & spinners
    │       ├── errorState.tsx    # Standardized error fallback boundaries
    │       └── emptyState.tsx    # Zero-data clinical placeholders
    │
    ├── features/                 # Domain-specific client logic & state
    │   ├── auth/authStore.ts     # User authentication state & JWT persistence
    │   ├── clinical/clinicalStore.ts # Patient vitals, predictions, & alert state
    │   └── dashboard/            # Specialized dashboard widgets
    │       ├── dashboardMetrics.tsx
    │       ├── liveActivityStream.tsx
    │       └── taskStatusTracker.tsx
    │
    ├── hooks/
    │   └── useWebSocket.ts       # Resilient WebSocket hook with exponential backoff
    │
    ├── lib/
    │   ├── api.ts                # Axios instance with auto-refresh interceptors
    │   ├── constants.ts          # Brand constants, API endpoints, risk colors
    │   └── utils.ts              # Class merging (`cn`), formatting helpers
    │
    └── types/
        └── index.ts              # Universal TypeScript clinical domain interfaces
```

---

## 4. Machine Learning Layout (`ml/`)

```
ml/
├── data/                         # Clinical datasets (UCI Heart Disease cohort)
│   └── raw/heart.csv             # 303 patient baseline records
├── preprocessing/                # Data cleaning & transformer pipelines
│   └── preprocessor.py           # Imputation, scaling, and categorical encoders
├── features/                     # Feature extraction & interaction terms
│   └── feature_engineering.py    # Cardiovascular risk factor derivation
├── training/                     # Model training scripts
│   ├── train_svm.py              # Support Vector Machine training
│   ├── train_random_forest.py    # Random Forest ensemble training
│   └── train_adaboost.py         # AdaBoost training
├── evaluation/                   # Model validation & benchmarking
│   └── evaluate.py               # ROC-AUC, Brier score, and confusion matrices
├── explainability/               # SHAP interpretation module
│   └── explainer.py              # TreeExplainer & natural language descriptions
├── inference/                    # Inference utilities
│   └── predict.py                # Standalone inference runner
├── registry/                     # Model registry metadata & artifact hashing
└── artifacts/models/             # Persisted joblib pipeline artifacts
    └── random_forest_risk_model/
        └── 1.0.0/pipeline.joblib # Active production model bundle
```
""")

    # -------------------------------------------------------------
    # docs/architecture/ (8 files)
    # -------------------------------------------------------------
    write_file("architecture/overview.md", """
# Architecture Overview

The **PatientRisk Clinical Decision Support System** is architected according to high-reliability software engineering principles designed to meet the rigorous demands of enterprise healthcare technology:

1. **Object-Oriented Programming (OOP):** Domain models, machine learning estimators, and real-time events are modeled as encapsulated classes with clear boundaries.
2. **SOLID Principles:**
   - *Single Responsibility:* Each service class (e.g., `PredictionService`, `ExplanationService`, `ReportService`) performs a single bounded clinical operation.
   - *Open/Closed:* Machine learning models and real-time event handlers can be extended without modifying core routing logic.
   - *Liskov Substitution:* All ML models implement standard scikit-learn estimator protocols.
   - *Interface Segregation:* DRF serializers are tailored to specific endpoints (read vs write) to eliminate over-fetching.
   - *Dependency Inversion:* Services depend on repository abstractions (`DjangoPredictionRepository`) rather than direct database queries.
3. **DRY (Don't Repeat Yourself):** Common model patterns (UUID primary keys, soft deletion, timestamp tracking) are encapsulated in `apps.core.models.BaseModel`.
4. **Service Layer Pattern:** Views handle HTTP serialization and authentication, delegating all domain logic to independent Python services.
""")

    write_file("architecture/frontend-architecture.md", """
# Frontend Architecture

The frontend is built using **Next.js 16 App Router** and **React 19**, designed to deliver an institutional-grade, zero-latency clinical user experience.

---

## 1. Architectural Strategy

- **Server-Side Rendering (SSR) for Static Assets:** Public landing pages, sign-in screens, and legal documentation are statically prerendered at build time for instant loading.
- **Client-Side Hydration (CSR) for Active Telemetry:** Authenticated clinician portals run as reactive Single Page Applications (SPAs), maintaining persistent WebSocket connections to the ASGI backend.
- **Strict State Management with Zustand:** State is partitioned into domain-specific stores:
  - `authStore`: Manages user credentials, JWT rotation, and role switching.
  - `clinicalStore`: Manages live patient vitals, stream predictions, task progress, and unread emergency alerts.

---

## 2. Real-Time Telemetry Flow

```
[WebSocket Message Received]
            │
            ▼
   [useWebSocket Hook]
            │
            ▼
  [Event Router Callback]
            │
            ▼
[clinicalStore.handleWebSocketPrediction()]
            │
    ┌───────┴────────┐
    ▼                ▼
[Update Dashboard] [Update Activity Stream]  (No Page Reload)
```

When a prediction is generated anywhere in the hospital, the ASGI consumer pushes the event over WebSockets. The `useWebSocket` hook catches the message and triggers an optimistic state update in `clinicalStore`, immediately updating the dashboard metrics, risk distribution counters, and activity feed without requiring a page reload.
""")

    write_file("architecture/backend-architecture.md", """
# Backend Architecture

The backend is built with **Django 5.0** and **Django REST Framework (DRF)**, powered by the **Daphne ASGI** server to concurrently handle high-throughput REST APIs and persistent WebSocket channels.

---

## 1. Layered Architecture Pattern

```
┌───────────────────────────────────────────────────────────┐
│                       HTTP / WSS Request                  │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│              Custom Middleware (Metrics, JWT, CORS)       │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│          API View / ViewSet (Request Validation & Auth)   │
└─────────────────────────────┬─────────────────────────────┘
                              ▼
┌───────────────────────────────────────────────────────────┐
│           Service Layer (Business Logic & Transactions)   │
│           - PredictionService                             │
│           - ExplanationService                            │
│           - ReportService                                 │
└──────────────────┬───────────────────────┬────────────────┘
                   ▼                       ▼
┌──────────────────────────┐    ┌───────────────────────────┐
│   Repository / ORM Layer │    │   ML Inference Engine     │
│   (Neon PostgreSQL)      │    │   (In-Memory scikit-learn)│
└──────────────────────────┘    └───────────────────────────┘
```

### Why Decouple Business Logic from Views?
In naive Django applications, business logic is frequently embedded directly into ViewSets or model save methods. In PatientRisk CDSS, business logic is strictly encapsulated within the **Service Layer** (`services/`):
- **Portability:** The exact same prediction logic is executed by the REST API (`PredictionViewSet`), the background batch worker (`celery_tasks/ml_tasks.py`), and automated integration tests.
- **Auditability:** Transactions, clinical overrides, and audit log entries are managed in atomic units within service methods.
- **Testability:** Unit tests can mock repository methods or ML models without needing complex HTTP test client setups.
""")

    write_file("architecture/ml-architecture.md", """
# Machine Learning Architecture

The Machine Learning subsystem operates as an integrated decision engine within the clinical application, combining predictive modeling with explainable AI.

---

## 1. Inference Pipeline Architecture

```mermaid
flowchart LR
    RawInput["Raw Clinical Vitals\n(BP, HR, Glucose, etc.)"] --> Imputer["Median / Mode\nImputer"]
    Imputer --> Scaler["StandardScaler\n(z-score normalization)"]
    Scaler --> Model["Trained Ensemble\n(Random Forest / SVM)"]
    Model --> Prob["Continuous Probability\n[0.0 - 1.0]"]
    Prob --> Stratifier["Risk Stratifier\n(LOW, MED, HIGH, CRIT)"]
    Model --> SHAP["TreeExplainer\n(SHAP Engine)"]
    SHAP --> Attributions["Factor Attributions\n& Descriptions"]
```

### 1.1 In-Memory Model Loader
To eliminate the latency of reloading multi-megabyte model artifacts from disk during high-frequency clinical workflows, the system employs the `ModelLoaderService`. This service:
- Maintains an in-memory thread-safe singleton cache of the active model pipeline.
- Automatically hashes and validates artifact integrity upon startup.
- Supports zero-downtime cache invalidation when a new model version is promoted via the Model Registry API.

### 1.2 Explainability via TreeSHAP
Predictions without clinical rationale are rarely trusted in healthcare. The system calculates SHAP (SHapley Additive exPlanations) values for every prediction:
$$\\text{Risk Score} = \\text{Base Value} + \\sum_{i=1}^{M} \\phi_i$$
Where $\\phi_i$ represents the positive or negative attribution of clinical feature $i$.
""")

    write_file("architecture/realtime-architecture.md", """
# Real-Time Architecture

The real-time infrastructure enables instantaneous bidirectional communication between hospital workstations and the backend decision-support engine.

---

## 1. Components & Communication Flow

1. **Protocol:** Standard WebSockets (`ws://` in local development, `wss://` in production via TLS termination).
2. **ASGI Server:** Daphne manages concurrent async event loops, terminating WebSocket connections without blocking HTTP threads.
3. **Channel Layer (Redis):** Operates as a distributed publish/subscribe message bus. When a worker on one container generates a prediction, it publishes to the `dashboard` group in Redis, and Daphne distributes the payload to all connected sockets.
4. **Multiplexed Topics:**
   - `dashboard`: High-level aggregate risk counters, telemetry, and system announcements.
   - `risk_alerts`: Emergency alerts for patients categorized as `HIGH` or `CRITICAL` risk.
   - `patient_{id}`: Targeted patient vitals and prediction telemetry stream.
   - `tasks_{user_id}`: Private channel for tracking long-running Celery background task progress.
""")

    write_file("architecture/database-architecture.md", """
# Database Architecture

The system utilizes **Neon Serverless PostgreSQL** as its single source of truth for all transactional, demographic, clinical, and audit data.

---

## 1. Neon Cloud Architecture & Configuration

Neon decouples Postgres compute from storage, allowing dynamic horizontal scaling and serverless scale-to-zero capabilities.

### 1.1 Connection Pooling
- **Pooled Connection String (`-pooler`):** Utilized by Django web workers. Routes queries through an integrated PgBouncer pool, supporting hundreds of concurrent connections without exhausting database memory.
- **Direct Connection String:** Utilized exclusively for schema migrations (`python manage.py migrate`), database introspection, and administrative DDL operations.

### 1.2 Branching Workflow
Neon provides zero-copy database branching in sub-seconds. In CI/CD pipelines, a temporary branch is spawned from production data to execute and validate migrations before merging.
""")

    write_file("architecture/security-architecture.md", """
# Security Architecture

The PatientRisk CDSS security architecture is designed to adhere to healthcare data security best practices, including HIPAA security rules.

---

## 1. Core Security Pillars

1. **Dual-Token JWT Authentication:**
   - Access tokens have a 15-minute lifespan to minimize the attack surface of token interception.
   - Refresh tokens (7-day lifespan) are stored in secure HTTP-only cookies or encrypted local stores and rotated upon use.
2. **Clinical Role-Based Access Control (RBAC):**
   - Endpoints enforce granular permission classes (`IsClinician`, `IsAdminUser`, `IsPatientOwner`).
   - Patients can never access other patients' records; staff actions are restricted to assigned departments.
3. **Immutable Clinical Auditing:**
   - Every modification to patient records, risk predictions, or clinical overrides triggers an automated entry in the `AuditLog` table.
   - Audit logs capture the user ID, client IP, action type, and JSON metadata diff.
4. **Secret Sanitation:**
   - Production secrets (database credentials, secret keys, Redis URLs) are injected solely via environment variables and never committed to source control.
""")

    write_file("architecture/deployment-architecture.md", """
# Deployment Architecture

The deployment architecture uses a multi-container Docker topology designed for zero-downtime deployments, horizontal worker scaling, and cloud database connectivity.

---

## 1. Container Topology

```mermaid
flowchart TD
    Internet((Clinician Users)) -->|HTTPS / WSS| Nginx[Nginx Reverse Proxy]
    Nginx -->|Port 3000| Frontend[Next.js 16 Standalone Container]
    Nginx -->|Port 8000| Backend[Daphne ASGI Backend Container]
    Backend <-->|Broker & Pub/Sub| Redis[(Redis 7 Container)]
    Backend <-->|Cloud DB Queries| NeonPostgres[(Neon PostgreSQL Cloud)]
    Redis <--> CeleryWorker[Celery Worker Container]
    Redis <--> CeleryBeat[Celery Beat Container]
    CeleryWorker <--> NeonPostgres
```

### 1.1 Separation of Database & Compute
As mandated by production guidelines, **PostgreSQL is never run inside a Docker container in production**. Neon Cloud PostgreSQL provides enterprise-grade durability, automated backups, and storage tier replication, freeing the container cluster to focus purely on stateless compute.
""")

    print("Generated root and architecture documentation.")


if __name__ == "__main__":
    generate()
