# Model Governance Framework — BPY-CSE-2666

> **Classification**: Healthcare Clinical Safety Document  
> **Enforcement**: Mandatory Across All Environments

---

## 1. Model Lifecycle State Machine

A model version strictly follows a 13-state deterministic finite state machine. Transitions outside the defined state flow are rejected by database transactions.

```
 [DRAFT] ───► [TRAINING] ───► [EVALUATING]
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
      [VALIDATION_FAILED]                      [PENDING_REVIEW]
                                                       │
                                   ┌───────────────────┴───────────────────┐
                                   ▼                                       ▼
                              [REJECTED]                               [APPROVED]
                                                                           │
                                                       ┌───────────────────┴───────────────────┐
                                                       ▼                                       ▼
                                                   [STAGED]                                 [CANARY]
                                                       │                                       │
                                                       └───────────────────┬───────────────────┘
                                                                           ▼
                                                                     [PRODUCTION]
                                                                           │
                                                       ┌───────────────────┴───────────────────┐
                                                       ▼                                       ▼
                                                  [DEPRECATED]                           [ROLLED_BACK]
                                                       │                                       │
                                                       └───────────────────┬───────────────────┘
                                                                           ▼
                                                                      [ARCHIVED]
```

### State Definitions
1. **`DRAFT`**: Initial specification; architecture, dataset ID, and target defined.
2. **`TRAINING`**: Model is currently undergoing asynchronous training in Celery.
3. **`EVALUATING`**: Post-training evaluation running (discrimination, calibration, fairness).
4. **`VALIDATION_FAILED`**: Performance, safety, or biological plausibility checks failed.
5. **`PENDING_REVIEW`**: Technical and clinical metrics compiled; awaiting human clinician approval.
6. **`APPROVED`**: Human clinician/informaticist has signed off on model validity.
7. **`STAGED`**: Model packaged, verified with SHA-256, and deployed to staging environment.
8. **`CANARY`**: Model deployed to evaluate on 10% of shadow traffic.
9. **`PRODUCTION`**: Active model serving live clinical predictions.
10. **`DEPRECATED`**: Model scheduled for replacement; new training version available.
11. **`ROLLED_BACK`**: Version deactivated due to clinical drift, incident, or regression.
12. **`REJECTED`**: Clinician rejected model deployment due to unacceptable metrics or safety risks.
13. **`ARCHIVED`**: Preserved strictly for audit and historical query reproducibility.

---

## 2. Separation of Duties

| Role | Permitted Actions | Prohibited Actions |
| :--- | :--- | :--- |
| **Medical Informaticist** | Trigger evaluations, audit drift, review fairness, clinically approve models (`PENDING_REVIEW` -> `APPROVED`), request retraining. | Cannot bypass infrastructure security or modify raw patient records. |
| **IT Admin** | Manage container runtimes, inspect artifact checksums, view system metrics, initiate emergency infrastructure rollbacks. | Cannot clinically approve model predictions or override clinical thresholds. |
| **Doctor / Clinician** | View predictions, inspect SHAP attributions, record clinical feedback, override risk assessments. | Cannot deploy or retrain models directly. |
| **Nurse** | View authorized patient risk levels and critical vital alerts. | Cannot access raw model weights or configuration. |
| **AI Agent (Ruflo)** | Assist with telemetry gathering, feature drift calculation, and automated drafting of evaluation reports. | **NEVER** permitted to approve models, change clinical thresholds, or promote to production. |

---

## 3. Human Clinician Sign-Off Gate

Autonomous deployment of machine learning models in healthcare is strictly forbidden. 
Every production deployment requires:
1. Documented `approval_id` tied to an authenticated `accounts.User` holding the `INFORMATICIST` or `DOCTOR` role.
2. Signed acknowledgment of the Clinical Safety Assessment and known model limitations.
3. Verification of SHA-256 artifact checksum.
