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
