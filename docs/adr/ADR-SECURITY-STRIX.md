# Architectural Decision Record (ADR): Strix Security Validation Service Integration

- **Status**: Approved
- **Deciders**: Enterprise Healthcare Security Officer, Principal Software Architect, Lead Clinical Informaticist, DevSecOps Lead
- **Date**: 2026-09-17

---

## 1. Context & Problem Statement
HealthNova AI is an enterprise Clinical Decision Support System (CDSS) processing vital healthcare telemetry, multi-modal machine learning risk predictions (SVM, Random Forest, AdaBoost, XGBoost), local LLM inferences (Ollama), and clinician decision workflows. Ensuring continuous defense-in-depth requires proactive application security, API testing, authorization verification, and vulnerability scanning.

However, standard automated penetration testing and autonomous security scanning tools introduce significant risks in regulated healthcare contexts:
1. **Uncontrolled network flooding or destructive attacks** could degrade real-time patient risk telemetry.
2. **Scanner memory or logs** could inadvertently capture and persist protected health information (PHI).
3. **Autonomous hallucination or out-of-scope scanning** could target production databases or third-party infrastructure.

We require a strictly controlled, policy-governed internal DevSecOps security engine that executes reproducible security verification within safe, isolated sandboxes.

---

## 2. Decision
We integrate the official **Strix** architecture (`usestrix/strix`, pinned version `1.0.2`) as our internal DevSecOps security validation engine via a decoupled provider adapter pattern (`StrixSecurityAdapter`).

The architectural integration adheres to six immutable healthcare invariants:
1. **Authoritative State in Neon PostgreSQL**: All targets, scan states, validated findings, and audit trails reside solely in Neon PostgreSQL. Strix runtime possesses no independent state authority.
2. **Decoupled Asynchronous Adapter Execution**: The Strix scanner runtime is isolated from Django web workers and runs exclusively inside Celery worker sandboxes on a dedicated `security_scans` queue.
3. **Default-Deny Policy Engine**: All scanning is governed by `SecurityPolicyEngine`. Scanning unapproved targets, production without dual-custody signoff, or forbidden paths (`/admin/destructive-test`, `/patient/export/*`) is strictly blocked.
4. **Global Emergency Kill-Switch**: `SECURITY_KILL_SWITCH = True` immediately halts running scans and rejects new scan requests.
5. **Zero-PHI Guarantee**: Before any scan evidence or finding description is persisted to the database, it passes through `SecretRedactionService` and synthetic data generators.
6. **SARIF 2.1.0 and Markdown Standardization**: Findings are ingested, deduplicated via SHA-256 fingerprints, and made exportable in industry-standard SARIF 2.1.0 format.

---

## 3. Consequences

### Positive
- **Deterministic Vulnerability Verification**: Eliminates theoretical noise by subjecting all scanner findings to the 7-question validation gate.
- **Fail-Safe Isolation**: If Strix or Celery fails or times out, clinical operations and real-time patient predictions continue completely uninterrupted.
- **Auditability & Traceability**: Every target approval, scan execution, kill-switch toggle, and export event is immutably logged to `SecurityAuditEvent`.
- **Standards Compliance**: Native export to OASIS SARIF 2.1.0 allows seamless integration into CI/CD pipelines (GitHub Actions, GitLab CI).

### Trade-offs & Mitigations
- **Resource Constraints**: Deep security scans require significant compute.
  - *Mitigation*: Hard limits enforced: max duration 300 seconds, max cost budget $10.00 USD, max concurrency 2 concurrent scans.
- **Production Safety**: Accidental execution against production could disrupt live operations.
  - *Mitigation*: Hardcoded `SECURITY_PRODUCTION_SCAN_ENABLED = False` by default; requires multi-party cryptographic approval and active maintenance windows.
