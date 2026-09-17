# Ruflo v3.42.0 Multi-Agent Orchestration Guide — BPY-CSE-2666

> **Healthcare AI Foundation Standard — Clinical Decision Support System**  
> **Topology:** Hierarchical | **Authoritative Store:** Neon PostgreSQL | **Config:** `.ruflo/config.json`

---

## 🚨 MANDATORY HEALTHCARE INVARIANTS

```
╔════════════════════════════════════════════════════════════════════════════╗
║ 1. Neon PostgreSQL is the SOLE AUTHORITATIVE SOURCE OF TRUTH.              ║
║ 2. ZERO patient PHI is stored in agent memory or shared vector indices.    ║
║ 3. AI NEVER issues autonomous medical diagnoses or final prescriptions.   ║
║ 4. ALL clinical recommendations require human clinician sign-off.         ║
║ 5. ML metrics (ROC-AUC, F1, Recall) must derive from actual evaluations.   ║
║ 6. Arbitrary shell, raw SQL, and unredacted PHI exports are FORBIDDEN.     ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## Agent Hierarchy & Roles

1. **Coordinator (`coordinator`)**:
   Top-level orchestrator. Dispatches subtasks, aggregates consensus, tracks execution steps, requests human approval.
2. **Clinical Safety Agent (`clinical-safety-agent`)**:
   Audits recommendations against deterministic rules (qSOFA, NEWS2) and uncertainty thresholds. Emits `SAFE`, `REVIEW_REQUIRED`, `UNSAFE`, or `INSUFFICIENT_INFORMATION`.
3. **ML Engineer Agent (`ml-engineer-agent`)**:
   Audits calibration, feature importances, and model metrics. Forbids metric fabrication.
4. **MLOps Agent (`mlops-agent`)**:
   Tracks feature drift (PSI, KS-test), manages model registry versions, enforces human gates for retraining.
5. **Clinical Explainability Agent (`clinical-explainability-agent`)**:
   Interprets TreeSHAP attributions and feature contributions for clinician review.
6. **Healthcare Security & Privacy Agents (`healthcare-security-agent`, `privacy-agent`)**:
   Audits RBAC boundaries, scans for prompt injection, enforces context minimization.
7. **Engineering Agents (`architect`, `coder`, `tester`, `reviewer`, `debugger`, `documentation-agent`)**:
   Maintain and enhance software quality, execute tests, and enforce React Doctor / PEP 8 standards.

---

## Execution Workflow (Policy-Governed Swarm)

1. **Context Minimization**: `ClinicalRiskContextBuilder` extracts only necessary vitals without patient identifiers.
2. **Safety Scan**: Query passes regex and semantic prompt injection filters.
3. **Execution**: Ruflo coordinates allowlisted tools (`get_patient_context`, `run_risk_prediction`, `retrieve_approved_knowledge`).
4. **Validation**: `clinical-safety-agent` validates synthesis; requires human review if high-risk or high-entropy.
5. **Audit Record**: Workflow writes immutable entries to PostgreSQL (`agent_tasks`, `ai_interactions`, `ai_agent_traces`).
6. **Realtime Broadcast**: Django Channels emits WebSocket update to authorized client.
