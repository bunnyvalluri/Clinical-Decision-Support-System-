# Clinical AI Tools Catalog & Authorization Governance

## 1. Safety & Deterministic Execution Rules
All tools available to the AI agent platform (`backend/apps/ai_agents/tools/`) execute deterministically within protected boundaries:
- **Authoritative Data Store**: Read exclusively from Neon PostgreSQL entities (`ClinicalRecord`, `Prediction`, `PredictionExplanation`, etc.).
- **RBAC Enforcement**: Calling user role is validated before tool invocation (`allowed_roles`).
- **ABAC Patient Scoping**: When `patient_data_access = True`, access is restricted to the authorized patient scope (`CanAccessPatientData`).
- **Immutable Audit Logging**: Every invocation records arguments hash, latency, status, calling user, and patient scope in `AgentToolExecution`.
- **SSRF Protection**: External literature search tools restrict egress to approved medical domains (NIH, CDC, WHO, NEJM, Lancet, JAMA) and block loopback/private subnets.

## 2. Tool Catalog

### Clinical Tools (`clinical_tools.py`)
| Tool Name | Risk Level | Authorized Roles | Description |
|-----------|------------|------------------|-------------|
| `get_patient_summary` | HIGH | Doctor, Nurse, Care Manager, Admin | Demographics, age calculation, blood group, admission status. |
| `get_patient_vitals` | HIGH | Doctor, Nurse, Care Manager, Admin | Objective physiological readings (HR, BP, SpO2, Temp, RR) from `ClinicalRecord`. |
| `get_patient_timeline` | HIGH | Doctor, Nurse, Admin | Chronological sequence of encounters, vital trends, and notes. |
| `get_patient_clinical_records`| HIGH | Doctor, Nurse, Admin | Detailed encounter records, symptoms, and lab panel results. |
| `get_patient_appointments` | LOW | Doctor, Nurse, Patient, Care Manager | Scheduled outpatient and clinical encounters. |
| `get_clinical_review` | HIGH | Doctor, Informaticist, Admin | Human clinician review decisions and concurring notes. |

### Prediction & Explainability Tools (`prediction_tools.py`)
| Tool Name | Risk Level | Authorized Roles | Description |
|-----------|------------|------------------|-------------|
| `get_patient_risk_prediction` | HIGH | Doctor, Informaticist | Calibrated risk predictions from Neon PostgreSQL. |
| `get_prediction_explanation` | HIGH | Doctor, Informaticist | TreeSHAP feature importances and top risk drivers. |
| `get_prediction_model_metadata` | MEDIUM | Doctor, Informaticist | Training provenance, algorithm, and schema version. |

### Knowledge & Guidelines (`rag_tools.py`)
| Tool Name | Risk Level | Authorized Roles | Description |
|-----------|------------|------------------|-------------|
| `search_authorized_clinical_documents` | LOW | Doctor, Nurse, Patient, Informaticist | Search curated guidelines (SSC 2021, KDIGO, AHA/ACC). |
| `retrieve_guideline` | LOW | Doctor, Nurse, Patient, Informaticist | Retrieve full text of protocol by identifier. |

### Analytics & MLOps (`analytics_tools.py`)
| Tool Name | Risk Level | Authorized Roles | Description |
|-----------|------------|------------------|-------------|
| `get_model_performance` | MEDIUM | Informaticist, Doctor, Admin | ROC-AUC, F1, Recall, Precision, Brier scores. |
| `get_data_quality_status` | MEDIUM | Informaticist, Doctor, Admin | Sensor stream completeness and missingness rates. |
| `get_prediction_drift` | MEDIUM | Informaticist, Admin | PSI scores and Kolmogorov-Smirnov drift statistics. |

### System & Search Tools (`search_tools.py`, `system_tools.py`)
| Tool Name | Risk Level | Authorized Roles | Description |
|-----------|------------|------------------|-------------|
| `external_search` | MEDIUM | Doctor, Informaticist, Admin | Search approved medical literature repositories with SSRF protection. |
| `get_service_health_diagnostics` | LOW | Admin, Informaticist | Operational vitality of PostgreSQL, Ollama, Redis, Celery. |
