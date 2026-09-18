# PDF Gap Analysis & Research Implementation Specification
**Document Version:** 1.0.0  
**Academic Reference:** *"Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques"*  
**Authoritative Store:** Neon PostgreSQL  
**Architecture Standard:** BPY-CSE-2666 / Spec Kit Governed Swarm  
**Date:** September 18, 2026  

---

## Executive Summary

This document establishes the authoritative technical gap analysis between the academic research paper *"Enhancing Clinical Decision Support Systems Through Patient Risk Level Prediction Using Machine Learning Techniques"* and the existing production-grade **HealthNova AI** Clinical Decision Support System (CDSS).

The existing application is a high-availability, multi-tenant clinical intelligence platform powered by Next.js 16 (App Router), Django 5 / Django REST Framework, Redis, Celery, Django Channels, Meilisearch, Ollama, Firecrawl, and Neon PostgreSQL. 

This audit details:
1. Exact PDF requirements vs. existing implementation.
2. Architectural enhancements to bridge all research and clinical usability gaps.
3. Strict corrections regarding database choice (preserving Neon PostgreSQL over legacy SQLite/MySQL) and honest ML performance metrics (rejecting unverified claims of 99% accuracy).
4. System-wide specifications across Backend, Database, ML, Realtime, Security, and Frontend tiers.

---

## 1. Architectural & Governance Invariants

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║ 1. NEON POSTGRESQL IS THE SOLE AUTHORITATIVE PERSISTENT SOURCE OF TRUTH.              ║
║    No SQLite or MySQL in production. No duplicate clinical databases.                 ║
║ 2. ZERO METRIC FABRICATION.                                                           ║
║    Reported 99% accuracy in the paper is a research citation; production metrics       ║
║    must derive strictly from real dataset evaluations with versioned provenance.       ║
║ 3. NON-AUTONOMOUS CLINICAL DECISION SUPPORT INVARIANT.                               ║
║    AI/ML never autonomously diagnoses, prescribes, orders tests, or discharges.       ║
║    Human clinician sign-off is mandatory for all clinical interventions.             ║
║ 4. STRICT WHITE/LIGHT THEME ONLY.                                                     ║
║    Zero dark-mode classes in clinical, administrative, or research portals.           ║
║ 5. REAL DATA ONLY / ZERO FAKE BUSINESS DATA.                                         ║
║    Empty states rendered when records do not exist; no Math.random() or mock arrays.  ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Requirement-by-Requirement Gap Analysis

| # | PDF Requirement | Existing Implementation | Missing Implementation / Gap | Required Change | Affected Files / Modules | DB Changes | API Changes | Frontend Changes | ML Changes | Tests Required |
|---|---|---|---|---|---|---|---|---|---|---|
| **1** | **Clinical Decision Support System (CDSS)** | Django apps (`clinical`, `predictions`, `patients`), Next.js 5-role portal. | Configurable risk threshold policy; explicit 3-tier risk classification support (Low, Medium, High). | Implement `RiskThresholdPolicy` model and service to configure tier thresholds without hardcoding. | `apps/predictions/models.py`, `services/risk_engine.py`, `services/policy_service.py` | Add `RiskThresholdPolicy` table. | `/api/v1/predictions/policies/` | Policy inspector in Informaticist portal. | Threshold mapping abstraction. | Test policy lifecycle & threshold bounds. |
| **2** | **Supervised ML Models: SVM, Random Forest, AdaBoost** | `SVMTrainer`, `RandomForestTrainer`, `AdaBoostTrainer` in `ml/training/trainers.py`. | Standardized runtime inference interfaces (`BaseRiskModel`, `SVCRiskModel`, `RandomForestRiskModel`, `AdaBoostRiskModel`) accessible via unified registry. | Create `BaseRiskModel` and concrete risk model classes in `ml/inference/` and register in runtime `ModelProvider`. | `ml/inference/models.py`, `services/model_provider.py`, `services/model_loader.py` | Model version algorithm metadata. | Model selection param in `/api/v1/predictions/` | Model selector dropdown with live comparative telemetry. | Implement unified runtime classes. | Inference parity tests across all 3 models. |
| **3** | **Data Preprocessing Pipeline** | `FeaturePreprocessor` and scikit-learn `ColumnTransformer` (median imputation + scaling + OHE). | Multi-stage versioned pipeline tracking: Raw -> Validation -> Missing Value -> Imputation -> Outliers -> Scaling -> OHE -> Feature Selection -> Output. | Implement `VersionedPreprocessingPipeline` capturing stage metadata, serialization, and schema validation. | `ml/preprocessing/pipeline.py`, `apps/model_registry/models.py` | Add `PreprocessingPipeline` model. | `/api/v1/models/pipelines/` | Pipeline DAG visualizer in Informaticist Workbench. | Stage-by-stage transform logger. | Pipeline determinism & skew tests. |
| **4** | **Model Comparison & Benchmarking** | Basic metrics dict stored in `ModelEvaluation`. | Unified cross-validation service computing Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Specificity, Sensitivity, Brier Score, and Calibration curves. | Implement `ModelEvaluationService` with cross-validation and patient-split isolation. | `services/evaluation_service.py`, `ml/evaluation/evaluator.py` | Store comprehensive metric fields in `ModelEvaluation`. | `/api/v1/models/compare/`, `/api/v1/models/research/` | `ModelComparisonTable` component on `/informaticist/models/research`. | Multi-metric evaluation matrix. | Benchmark calculation accuracy tests. |
| **5** | **Data Quality Engine** | Basic physiological limit checks in `FeaturePreprocessor` and high-level `DataQualityReport`. | Granular anomaly detection (impossible values, missingness drift, duplicate records, unit mismatch) with tracked issue records. | Create `ClinicalDataQualityService` and `DataQualityIssue` entity with assigned status and remediation workflows. | `apps/clinical/models.py`, `services/data_quality_service.py` | Add `DataQualityIssue` table with foreign keys to Patient. | `/api/v1/data-quality/issues/`, `/api/v1/data-quality/summary/` | `DataQualityDashboard` component with severity badges. | Distribution anomaly heuristics. | Unit tests for invalid clinical values. |
| **6** | **Patient Clinical Timeline** | Encounters and predictions queried separately. | Unified temporal event aggregator merging registrations, vitals, labs, predictions, reviews, alerts, and AI summaries. | Implement `PatientTimelineService` returning normalized timeline events with correlation IDs. | `services/timeline_service.py`, `apps/patients/views.py` | Add `ClinicalTimelineEvent` or dynamic query aggregator. | `/api/v1/patients/{id}/timeline/` | `ClinicalTimeline` UI component with responsive mobile view. | N/A | Timeline event ordering and filtering tests. |
| **7** | **Historical Predictions Tracking** | `Prediction` table with foreign key to patient. | Clinician UI for sequential prediction comparison (Prediction #1, #2...) with delta indicators over time. | Create `/doctor/patients/:patientId/predictions` subroutes with longitudinal trajectory visualization. | `frontend/src/app/doctor/patients/[patientId]/predictions/page.tsx`, `apps/predictions/views.py` | Add query indexes for patient prediction ordering. | `/api/v1/patients/{id}/predictions/` | `PredictionHistoryView` with delta chips. | N/A | Longitudinal query tests. |
| **8** | **Explainable AI (TreeSHAP & Textual Insights)** | `ExplanationService` computing SHAP/fallback attributions. | Clear clinical labeling separating "Model attribution" from "Medical etiology"; accessible text descriptions. | Ensure disclaimer is attached to every prediction explanation; provide natural language factor descriptions. | `services/explanation_service.py`, `frontend/src/components/predictions/PredictionExplanationPanel.tsx` | Ensure explanation schema contains disclaimer. | `/api/v1/predictions/{id}/explanation/` | `PredictionExplanationPanel` with factor waterfall and text notes. | SHAP waterfall formatting. | TreeSHAP attribution verification tests. |
| **9** | **Uncertainty & Abstention** | `ClinicalUncertaintyEstimator` in `ml/inference/uncertainty.py`. | Seamless integration into `RiskPredictionEngine` to emit `REVIEW_REQUIRED` state when confidence is below threshold. | Integrate `PredictionConfidenceService` into prediction workflow; return abstention status. | `services/confidence_service.py`, `services/risk_engine.py` | Add `uncertainty_score` and `abstention_flag` to Prediction. | Prediction response payload includes uncertainty metadata. | Display `REVIEW_REQUIRED` warning badge on risk cards. | Shannon entropy & margin calculations. | Abstention threshold trigger tests. |
| **10** | **Out-of-Distribution (OOD) Detection** | `OutOfDistributionDetector` in `ml/inference/ood_detector.py`. | Live evaluation during inference; warning flags presented to clinician on high Mahalanobis/z-score distance. | Wrap detector in `OODDetectionService` and include OOD flags in prediction response. | `services/ood_service.py`, `services/risk_engine.py` | Add `ood_status` and `anomaly_score` to Prediction. | Return `ood_status` in `/api/v1/predictions/` | Amber OOD alert pill on patient assessment view. | Multivariate z-score distance tracking. | OOD synthetic record detection tests. |
| **11** | **Model Registry Governance** | `ModelVersion`, `ModelEvaluation`, `ModelApproval`, `ModelDeployment`, `ModelRollback` in `model_registry`. | Strict 6-gate promotion workflow (Trained -> Evaluated -> Validated -> Clinical Review -> Approved -> Deployed). | Implement `ModelGovernanceService` enforcing prerequisite gates before activation. | `apps/model_registry/models.py`, `services/governance_service.py` | Ensure gate verification constraints. | `/api/v1/models/{id}/approve/`, `/api/v1/models/{id}/promote/` | Approval modal with clinical rationale textarea. | Validation check runner. | Governance transition state machine tests. |
| **12** | **Drift Detection & Monitoring** | Population Stability Index (PSI) & Kolmogorov-Smirnov algorithms in `ml/mlops/drift.py`. | Automated periodic drift auditing generating persisted `DriftReport` records (Normal, Warning, Critical). | Implement `DriftDetectionService` and exposed dashboard endpoints. | `services/drift_service.py`, `apps/model_registry/models.py` | Add `DriftReport` entity. | `/api/v1/models/drift/`, `/api/v1/models/drift/reports/` | `ModelDriftDashboard` component. | KS-test & PSI feature distribution checks. | Drift detection threshold tests. |
| **13** | **Fairness & Subgroup Analysis** | `ClinicalFairnessEvaluator` in `ml/evaluation/fairness.py`. | Persisted subgroup metrics (age groups, biological sex) with sample-size insufficiency warnings. | Expose fairness evaluation endpoint and UI dashboard. | `services/fairness_service.py`, `apps/model_registry/views.py` | Add `FairnessEvaluation` entity or JSON payload in evaluation. | `/api/v1/models/fairness/` | `FairnessEvaluationDashboard` component. | Disparate impact & parity calculations. | Subgroup metric computation tests. |
| **14** | **Real-Time Notification Engine** | `apps/notifications`, Celery tasks, WebSocket consumer. | Structured event routing for `PATIENT_UPDATED`, `VITAL_RECORDED`, `PREDICTION_CREATED`, `HIGH_RISK_ALERT`, `DATA_QUALITY_ALERT`, `DRIFT_DETECTED`. | Implement `ClinicalNotificationService` with privacy filtering and channel routing. | `services/notification_service.py`, `channels_app/events.py` | Store dispatch metadata in Notification. | WebSocket broadcast & REST `/api/v1/notifications/` | Realtime toast & notification bell dropdown. | Realtime trigger dispatch. | Notification dispatch & WebSocket tests. |
| **15** | **FHIR / EHR Interoperability Boundary** | N/A (Internal relational models). | FHIR R4 mapping facade for `Patient`, `Observation`, `Condition`, `RiskAssessment`, `Encounter`. | Implement `FHIRAdapter` service providing bidirectional mapping between internal models and FHIR resources. | `services/fhir_adapter.py`, `apps/clinical/fhir_views.py` | N/A (Virtual transformation layer). | `/api/v1/fhir/Patient/`, `/api/v1/fhir/Observation/` | Export FHIR JSON action button. | Feature mapping to LOINC/SNOMED. | FHIR R4 schema compliance tests. |
| **16** | **Informatics Research Dashboard** | Literature search workbench at `/informaticist/research`. | Dedicated ML research dashboard at `/informaticist/models/research` showing Dataset, Models, Evaluation, Explainability, Validation. | Create `/informaticist/models/research/page.tsx` connecting directly to live backend model metrics. | `frontend/src/app/informaticist/models/research/page.tsx` | N/A | `/api/v1/models/research-benchmarks/` | Full multi-section ML Research Dashboard. | Model benchmark summary generator. | Component render & route navigation tests. |
| **17** | **Doctor Workflow Subroutes** | `/doctor/dashboard`, `/doctor/patients`, `/doctor/reviews`. | Missing subroutes: `/doctor/patients/:patientId/timeline`, `/doctor/patients/:patientId/predictions`, `/doctor/patients/:patientId/predictions/:predictionId`, `/doctor/reviews/:reviewId`. | Implement missing subroutes with rich clinical detail, timeline, and comparison panels. | `frontend/src/app/doctor/patients/[patientId]/...`, `frontend/src/app/doctor/reviews/[reviewId]/page.tsx` | N/A | Backend endpoints exist or are mapped. | Dedicated doctor subroute pages. | N/A | Next.js route build & page render tests. |
| **18** | **Nurse Workflow Integration** | `/nurse/dashboard`, `/nurse/triage`, `/nurse/alerts`. | Seamless vitals entry with automatic trigger of risk prediction and triage escalation. | Integrate triage reassessment with `ClinicalRiskEngine` auto-inference. | `frontend/src/app/nurse/patients/[patientId]/vitals/new/page.tsx` | N/A | `/api/v1/clinical/` -> trigger prediction | Immediate risk badge on vitals submit. | Realtime inference on save. | Nurse vitals to prediction workflow tests. |

---

## 3. Database Schema Extensions (Neon PostgreSQL)

All extensions strictly preserve Neon PostgreSQL as the authoritative store:

1. **`RiskThresholdPolicy`** (`apps/predictions/models.py`):
   - `policy_version` (varchar 50, unique)
   - `model_version` (FK -> `ModelVersion`)
   - `low_threshold` (decimal 4,3)
   - `medium_threshold` (decimal 4,3)
   - `high_threshold` (decimal 4,3)
   - `effective_date` (datetime)
   - `is_active` (boolean)
   - `approved_by` (FK -> `accounts.User`)
   - `clinical_rationale` (text)

2. **`DataQualityIssue`** (`apps/clinical/models.py`):
   - `patient` (FK -> `patients.Patient`, nullable)
   - `clinical_record` (FK -> `clinical.ClinicalRecord`, nullable)
   - `issue_type` (varchar 50: `INVALID_VALUE`, `OUTLIER`, `MISSING_CRITICAL`, `UNIT_MISMATCH`, `DUPLICATE`)
   - `severity` (varchar 20: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
   - `feature_name` (varchar 100)
   - `observed_value` (text)
   - `expected_range` (varchar 100)
   - `detected_at` (datetime)
   - `status` (varchar 30: `OPEN`, `ASSIGNED`, `RESOLVED`, `IGNORED`)
   - `assigned_to` (FK -> `accounts.User`, nullable)
   - `resolution_notes` (text)

3. **`DriftReport`** (`apps/model_registry/models.py`):
   - `model_version` (FK -> `ModelVersion`)
   - `evaluation_timestamp` (datetime)
   - `status` (varchar 20: `NORMAL`, `WARNING`, `CRITICAL`)
   - `psi_metrics` (JSONField)
   - `ks_metrics` (JSONField)
   - `features_drifted` (JSONField)
   - `summary` (text)

4. **`FairnessEvaluation`** (`apps/model_registry/models.py`):
   - `model_version` (FK -> `ModelVersion`)
   - `subgroup_field` (varchar 50: `sex`, `age_tier`)
   - `metrics_by_subgroup` (JSONField)
   - `disparate_impact_ratio` (decimal 5,4)
   - `sample_size_warnings` (JSONField)
   - `evaluated_at` (datetime)

---

## 4. API Endpoints Architecture

All new and upgraded endpoints conform to `/api/v1/` standards and enforce role-based access control:

- `GET /api/v1/patients/{id}/timeline/` — Aggregated clinical timeline (Doctor, Nurse, Patient self).
- `GET /api/v1/patients/{id}/predictions/` — Longitudinal prediction history (Doctor, Informaticist, Patient self).
- `GET /api/v1/predictions/policies/` — Risk threshold policies (Informaticist, Admin, Doctor).
- `POST /api/v1/predictions/policies/` — Create new policy version (Informaticist, Admin).
- `GET /api/v1/data-quality/issues/` — Active data quality issues (Informaticist, Nurse, Admin).
- `POST /api/v1/data-quality/issues/{id}/resolve/` — Resolve issue (Informaticist, Nurse).
- `GET /api/v1/models/research-benchmarks/` — Consolidated benchmarks for SVM, RF, and AdaBoost (Informaticist, Admin).
- `GET /api/v1/models/drift/` — Live drift detection status (Informaticist, Admin).
- `GET /api/v1/models/fairness/` — Subgroup fairness evaluations (Informaticist, Admin).
- `GET /api/v1/fhir/Patient/{id}` — FHIR R4 Patient representation (Doctor, Admin).
- `GET /api/v1/fhir/Observation/?patient={id}` — FHIR R4 Observations (Doctor, Admin).

---

## 5. Implementation Roadmap

```
PHASE 1: RESEARCH AUDIT & DATA MODEL EXTENSIONS
  ├── Create docs/research/PDF_GAP_ANALYSIS.md (This Document)
  ├── Add RiskThresholdPolicy, DataQualityIssue, DriftReport, FairnessEvaluation models
  └── Run database migrations on Neon PostgreSQL

PHASE 2: ML RESEARCH & ENGINE UPGRADE
  ├── Implement BaseRiskModel, SVCRiskModel, RandomForestRiskModel, AdaBoostRiskModel
  ├── Implement ModelEvaluationService (cross-validation, honest metrics, no fabrication)
  ├── Implement ClinicalRiskEngine with configurable policy and abstention
  ├── Implement OODDetectionService and PredictionConfidenceService
  └── Implement VersionedPreprocessingPipeline

PHASE 3: SERVICES & REALTIME WORKFLOW
  ├── Implement PatientTimelineService
  ├── Implement ClinicalDataQualityService
  ├── Implement DriftDetectionService & ClinicalFairnessService
  ├── Implement ClinicalNotificationService
  └── Implement FHIR R4 Adapter Facade

PHASE 4: FRONTEND WORKSPACE EXPANSION (SHADCN/UI, STRICT WHITE THEME)
  ├── Reusable UI Components:
  │   ├── RiskAssessmentCard
  │   ├── ClinicalTimeline
  │   ├── ModelComparisonTable
  │   ├── PredictionExplanationPanel
  │   ├── DataQualityDashboard
  │   ├── ModelDriftDashboard
  │   └── FairnessEvaluationDashboard
  ├── Informaticist ML Research Dashboard: /informaticist/models/research
  ├── Doctor Workflow Subroutes:
  │   ├── /doctor/patients/[patientId]/timeline
  │   ├── /doctor/patients/[patientId]/predictions
  │   ├── /doctor/patients/[patientId]/predictions/[predictionId]
  │   └── /doctor/reviews/[reviewId]
  └── Nurse Vitals-to-Risk Integration

PHASE 5: COMPREHENSIVE VERIFICATION & CONVERGENCE
  ├── Unit and integration test suites (Node, Python/Django, Bruno)
  ├── React Doctor frontend quality audit
  ├── Docker build validation
  └── Production deployment to Vercel and Neon PostgreSQL sync
```

---

## 6. Academic Research Traceability Graph

```
CLINICAL COHORT DATASET (UCI Heart Disease + Modern EHR Vitals)
                       ↓
PREPROCESSING PIPELINE (v1.0: Imputation + Outlier + Scale + OHE)
                       ↓
EXPERIMENT RUNS (CV Split: 5-Fold Stratified, Zero Patient Leakage)
   ├── SVC (RBF Kernel, C=1.0, Platt Calibrated)
   ├── Random Forest (n=100, max_depth=6, TreeSHAP)
   └── AdaBoost (n=50, lr=0.8, Sequential Weak Learners)
                       ↓
MODEL EVALUATION SERVICE (Accuracy, F1, ROC-AUC, Brier, Calibration)
                       ↓
CLINICAL SAFETY & GOVERNANCE GATE (Deterministic Rules + Informaticist Approval)
                       ↓
ACTIVE PRODUCTION REGISTRY (model_version_id, SHA-256 Checksum)
                       ↓
CLINICAL INFERENCE ENGINE (OOD Check + Confidence Check + SHAP Attribution)
                       ↓
PERSISTENCE & TELEMETRY (Neon PostgreSQL + Redis Channels + Celery Reports)
                       ↓
CLINICIAN WORKSPACE (Doctor Concurrence / Override with Immutable Audit)
```

---
*End of Gap Analysis. Approved for implementation under Ruflo Multi-Agent Orchestration.*
