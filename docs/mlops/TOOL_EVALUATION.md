# EthicalML / Awesome Production Machine Learning Tool Evaluation Matrix

> **Application**: Clinical Decision Support System (BPY-CSE-2666)  
> **Reference Ecosystem**: [EthicalML/awesome-production-machine-learning](https://github.com/EthicalML/awesome-production-machine-learning)  
> **Standard**: Zero Tool Sprawl • Authoritative Neon PostgreSQL • Strict Human Clinician Sign-Off

---

## 1. Executive Summary & Policy

The EthicalML curated ecosystem contains hundreds of production-grade tools across 15+ sub-domains. In critical healthcare systems, blindly adopting tools creates maintenance hazards, security attack surfaces, and HIPAA compliance risks. 

Our architectural policy mandates:
1. **Smallest Suitable Tool**: Prefer native standard implementations leveraging Python, Django, PostgreSQL, and Celery over external distributed clusters.
2. **Authoritative Neon PostgreSQL**: Never deploy secondary databases for metadata, lineage, or registries that can diverge from clinical truth.
3. **No Unsafe Dependencies**: Avoid unmaintained or vulnerable open-source packages.

---

## 2. Comprehensive Tool Evaluation Matrix

| Tool | Category | Purpose & Problem Solved | Complexity | License | Security & Privacy Implications | Healthcare Suitability | Decision | Rationale for Selection / Rejection |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Native Django + Neon PostgreSQL Model Registry** | Model Registry & Lineage | Immutably tracks model versions, artifact hashes, evaluation metrics, and clinical approval state machines. | Low (Native) | BSD-3 (Django) | High: Direct RBAC, encrypted at rest, zero external data movement. | Excellent | **SELECTED** | Keeps Neon PostgreSQL as sole source of truth; avoids hosting standalone MLflow or ClearML servers. |
| **MLflow Registry** | Model Registry | Standalone model registry server and artifact store. | High | Apache 2.0 | Medium: Requires separate auth layer, exposes REST attack surface. | Moderate | **REJECTED** | Redundant server infrastructure; creates duplicate metadata store outside Neon PostgreSQL. |
| **DVC (Data Version Control)** | Dataset Versioning | Git-based data hashing and remote artifact pointer tracking. | Low-Med | Apache 2.0 | High: Only tracks hashes in Git; clinical data remains in secure S3/Blob storage. | Good | **PATTERN ADOPTED** | Adopted DVC hashing paradigm (SHA-256 metadata pointers) natively within PostgreSQL `DatasetVersion` records. |
| **Great Expectations** | Data Validation | Declarative pipeline testing for data distributions, types, and ranges. | Medium | Apache 2.0 | High: Local execution, no PHI export. | Good | **PATTERN ADOPTED** | Implemented lightweight deterministic domain validator (`DataValidator`) tailored to physiological ranges without heavy external daemon. |
| **Celery + Redis** | Workflow Orchestration | Asynchronous job execution for training, evaluation, drift calculation, and batch jobs. | Medium (Existing) | BSD | High: Runs in private VPC, zero external orchestration attack surface. | Excellent | **SELECTED** | Already established in BPY-CSE-2666; robust task retries, concurrency bounds, and scheduling. |
| **Kubeflow Pipelines / Airflow** | Workflow Orchestration | Heavy DAG workflow engine for distributed Kubernetes clusters. | Very High | Apache 2.0 | Complex: Requires extensive RBAC sync and multi-service management. | Poor for current scale | **REJECTED** | Extreme operational overhead and resource consumption for a clinical decision support system. |
| **SHAP (SHapley Additive exPlanations)** | Explainability | TreeSHAP and KernelSHAP for local and global feature attributions. | Low | MIT | High: Local compute, no external API transmission. | Excellent | **SELECTED** | De-facto clinical explainability standard; provides mathematically consistent feature attributions. |
| **Evidently AI / Scikit-Multiflow** | Drift & Monitoring | Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) drift telemetry. | Low | Apache 2.0 | High: Computes summary statistics locally; zero raw data retention. | Excellent | **PATTERN ADOPTED** | Built native `DriftDetector` executing vectorized PSI & KS two-sample tests directly against trailing batches. |
| **AIF360 (IBM AI Fairness)** | Responsible AI / Fairness | Disparate impact, demographic parity, and equalized odds scanning across demographic cohorts. | Low-Med | Apache 2.0 | High: Local validation during model evaluation gates. | Excellent | **PATTERN ADOPTED** | Embedded demographic parity and false-negative parity checks directly into `FairnessEvaluator` gate. |
| **Seldon Core / BentoML** | Model Serving | Dedicated Kubernetes model microservice serving cluster. | High | Apache 2.0 | Medium: Microservice hop adds network latency and complex zero-trust auth. | Moderate | **REJECTED** | Monolithic/in-process ASGI serving via Django/Gunicorn offers sub-millisecond local inference with direct DB transactions. |
| **Feast / Hopsworks** | Feature Store | Online/offline feature store with dual key-value databases. | High | Apache 2.0 | Medium: Dual-storage consistency hazards and additional database management. | Poor | **REJECTED** | Unnecessary complexity. Versioned PostgreSQL feature schemas with point-in-time joins suffice completely. |
| **Joblib / Safetensors** | Model Serialization | Serializing trained scikit-learn estimators and scalers. | Low | BSD | Critical: Joblib/Pickle must be guarded by SHA-256 checksums and restricted deserialization. | High (with guards) | **SELECTED (Guarded)** | Standard for scikit-learn; secured with cryptographic SHA-256 checksum verification before loading. |
| **Differential Privacy (Opacus/Diffprivlib)** | Privacy-Preserving ML | Noise injection and gradient clipping for privacy budgets. | Med-High | Apache 2.0 | High: Mathematically bounded privacy loss. | Good | **EVALUATED** | Context minimization, zero-PHI feature extraction, and pseudonymization provide sufficient clinical privacy for tabular models. |

---

## 3. Tool Adoption Summary

1. **Model Governance & Registry**: Native PostgreSQL schema + Django REST APIs (`ModelVersion`, `ModelEvaluation`, `ModelDeployment`, `ModelApproval`, `ModelRollback`).
2. **Data & Pipeline Validation**: In-process `ClinicalRiskDataValidator` with biological plausibility ranges and patient deduplication.
3. **Model Training & Benchmarking**: Scikit-learn (SVM, Random Forest, AdaBoost) with stratified patient-level splitting (`GroupShuffleSplit`).
4. **Explainability**: SHAP with explicit clinical framing ("Feature contributed to prediction", never "caused disease").
5. **Drift Telemetry**: Vectorized Population Stability Index (PSI) and two-sample Kolmogorov-Smirnov test.
6. **Task Scheduling & Asynchronous Execution**: Celery beat + Redis queues with resource bounds and dead-letter handling.
