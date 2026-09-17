# Clinical AI Agents Architecture & Operational Guide

## 1. System Overview
The `ai_agents` subsystem provides production-grade, healthcare-safe AI agent orchestration for HealthNova AI (`BPY-CSE-2666`). Derived from real-world agent patterns (tool calling, persistent memory, multi-provider routing, and state machine loops), the platform is governed by non-negotiable medical invariants.

```
                  +-----------------------------------+
                  |         User / Clinician          |
                  +-----------------+-----------------+
                                    |
                          REST API / WebSocket
                                    |
                                    v
                  +-----------------------------------+
                  |       AI Agent Orchestrator       |
                  |     (Plan -> Act -> Observe)      |
                  +--------+-----------------+--------+
                           |                 |
                +----------v-------+  +------v----------+
                |  Tool Registry   |  | Safety Service  |
                |  (RBAC/ABAC Gate)|  | (Prompt Inject) |
                +----------+-------+  +-----------------+
                           |
        +------------------+------------------+
        |                  |                  |
+-------v-------+  +-------v-------+  +-------v-------+
| Clinical Data |  | Risk Predict  |  | Guideline RAG |
| (Neon Postgres|  | (TreeSHAP)    |  | (Literature)  |
+---------------+  +---------------+  +---------------+
```

## 2. Core Operational Loop
1. **PLAN**: Agent receives prompt, evaluates user role and patient scope, retrieves authorized context without raw PHI.
2. **ACT**: Agent determines necessary tool invocations. High-risk actions trigger server-side approval gates (`ApprovalStatus.REQUESTED`).
3. **OBSERVE**: Authorized tools execute against Neon PostgreSQL. Execution time and input SHA-256 hashes are recorded in `AgentToolExecution`.
4. **VALIDATE**: `ValidationService` scans synthesis for autonomous prescription violations, verifies citations, and estimates grounding scores.
5. **CONTINUE / STOP**: Loop terminates when answers are grounded or iteration bounds (default: 8) are reached.

## 3. Role Archetypes
- **DOCTOR**: Comprehensive clinical decision support, calibrated risk score interpretation, and literature guideline synthesis.
- **NURSE**: Bedside triage criteria (qSOFA, NEWS2), vital sign deterioration alerts, and escalation protocol verification.
- **PATIENT**: Plain-language health education and appointment preparation with strict disclaimers.
- **INFORMATICIST**: MLOps drift metrics (PSI, KS-statistic), model calibration curves, and evaluation dataset tracking.
- **ADMIN**: Infrastructure health diagnostics, AI Gateway throughput, and safety incident logs.
