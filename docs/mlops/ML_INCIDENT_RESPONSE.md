# ML Incident Response & Operational Safety Playbook — BPY-CSE-2666

> **Classification**: Operational Security & Clinical Safety  
> **Scope**: Model Degradation, Adversarial Inputs, Data Poisoning, Outages

---

## 1. Severity Classification

| Severity Level | Trigger Conditions | Automated Response | Required Human Action |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Model inference throws uncaught exceptions; artifact checksum mismatch; population PSI $> 0.25$; emergency clinician override $> 15\%$. | Automatic fallback to clinical baseline rule; prediction marked `REVIEW_REQUIRED`; alert dispatched via WebSocket. | Immediate IT Admin & Informaticist triage; trigger instant rollback to last verified stable version. |
| **HIGH** | Population PSI $0.15 - 0.25$; calibration Brier score $> 0.08$; prediction latency $> 200\text{ ms}$. | Log warning telemetry; queue model evaluation job. | Medical Informaticist investigates drift sources within 4 hours. |
| **WARNING** | PSI $0.10 - 0.15$; minor feature missingness increase ($< 5\%$). | Record metric in `DriftReport`. | Review in weekly clinical informatics sync. |
| **INFO** | Routine retrain completion, scheduled calibration verification. | Standard audit logging. | Routine review. |

---

## 2. Playbooks for Specific Incidents

### Playbook A: Artifact Tampering or Checksum Mismatch
1. **Detection**: `ModelLoaderService` detects computed SHA-256 does not match database record.
2. **Action**: Immediate load abort. Model state marked `VALIDATION_FAILED`.
3. **Fallback**: Return `SERVICE_UNAVAILABLE` or deterministic qSOFA/NEWS2 rule evaluation.
4. **Security**: IT Admin inspects filesystem for unauthorized modification; security audit log emitted.

### Playbook B: Severe Feature / Population Drift
1. **Detection**: Daily Celery drift job detects feature PSI $> 0.25$ on key vital (e.g., blood pressure).
2. **Action**: Flag alerts on `/informaticist/drift`.
3. **Investigation**: Medical Informaticist investigates whether hospital demographic change, seasonal fluctuation, or lab calibration shifted the inputs.
4. **Retraining**: Initiate versioned dataset creation and candidate model retraining with clinical sign-off gate.
