# AI Agent Architecture & Swarm Topology

**Project:** Clinical Decision Support System (BPY-CSE-2666)  
**Document Version:** 1.0.0

---

## 1. Agent Hierarchy

The agent structure follows a strict hierarchical tree:

```
                            [Coordinator Agent]
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
     [Planning Team]          [Security Team]          [Validation Team]
     ├── Architect            ├── Sec Architect         ├── Reviewer
     ├── Researcher           ├── Sec Auditor           ├── Tester
     └── Planner              ├── Privacy Agent         ├── Debugger
                              └── Healthcare Sec        └── Doc Agent
                                     │
                                     ▼
                          [Healthcare Domain Team]
                          ├── Clinical Safety Agent
                          ├── ML Engineer Agent
                          ├── MLOps Agent
                          ├── Explainability Agent
                          ├── Data Quality Agent
                          └── Clinical Workflow Agent
```

---

## 2. Specialized Agent Personas & Invariants

### 1. Clinical Safety Agent (`clinical-safety-agent`)
- **Primary Mission**: Enforce medical safety policies, detect unsupported clinical claims, and mandate human review when uncertainty is elevated.
- **Output Verdicts**:
  - `SAFE`: Calibrated ML output matches deterministic protocols and peer-reviewed guidelines.
  - `REVIEW_REQUIRED`: Discrepancy between ML prediction and deterministic score, or high predictive entropy (>0.90), or out-of-distribution physiology.
  - `UNSAFE`: Query or candidate suggestion violates safety guardrails or suggests contraindications.
  - `INSUFFICIENT_INFORMATION`: Missing critical baseline vitals required to compute risk stratification.
- **Hard Invariant**: Under no circumstances can the agent issue an autonomous prescription or final medical diagnosis.

### 2. ML Engineer Agent (`ml-engineer-agent`)
- **Primary Mission**: Audit training/test splits, evaluate feature importances, assess calibration curves, and evaluate ensemble models (Random Forest, SVM, AdaBoost).
- **Hard Invariant**: **Zero metric fabrication**. Accuracy, Recall, Precision, F1, and ROC-AUC figures must derive directly from executed evaluation runs on PostgreSQL-stored datasets.

### 3. MLOps Agent (`mlops-agent`)
- **Primary Mission**: Monitor feature drift (PSI, KS-test), track prediction distribution divergence, manage model registry metadata, and orchestrate rollback procedures.
- **Hard Invariant**: Autonomous model replacement in production is prohibited. Retraining triggers and model promotion mandate explicit human-in-the-loop authorization (`AIApprovalGate`).

### 4. Healthcare Security Agent (`healthcare-security-agent`) & Privacy Agent (`privacy-agent`)
- **Primary Mission**: Audit RBAC boundaries, detect prompt injection attempts, enforce context minimization, and ensure no patient PHI enters agent memory.
- **Hard Invariant**: Zero PHI in external LLM tokens or shared agent memory.

---

## 3. Communication Protocols

Agents exchange messages using strongly-typed JSON envelopes:

```json
{
  "message_id": "msg-uuid-v4",
  "workflow_id": "wf-uuid-v4",
  "sender_agent": "ml-engineer-agent",
  "receiver_agent": "coordinator",
  "timestamp": "2026-09-15T15:30:00Z",
  "task_type": "MODEL_EVALUATION",
  "status": "COMPLETED",
  "payload": {
    "model_name": "RandomForest_Ensemble_v2",
    "roc_auc": 0.912,
    "recall": 0.884,
    "drift_detected": false
  },
  "signature": "hmac-sha256-signature"
}
```

---

## 4. Multi-Agent Consensus Protocol

For complex clinical evaluations:
1. `clinical-workflow-agent` generates an initial synthesis based on retrieved vitals and predictions.
2. `clinical-explainability-agent` verifies the contribution of key physiological indicators.
3. `clinical-safety-agent` audits the recommendation against deterministic scoring guidelines.
4. If all agents agree, `coordinator` compiles the final structured draft.
5. If **any** agent detects conflict, high uncertainty, or safety violations, the workflow transitions immediately to `REVIEW_REQUIRED` and flags the exact reason for the clinician.
