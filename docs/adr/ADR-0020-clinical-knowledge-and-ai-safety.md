# ADR-0020: Clinical Knowledge, Guideline Management, AI Safety Gate, and Human-in-the-Loop Architecture

**Status**: Accepted  
**Date**: 2026-09-21  
**Deciders**: Principal Healthcare Software Architect, Principal Clinical AI Engineer, Senior Machine Learning Engineer, Clinical Informatics Architect, DevSecOps Lead  
**Specification Ref**: BPY-CSE-2666 / Prompt 64  

---

## 1. Context & Problem Statement

In clinical AI decision support systems (CDSS), combining machine learning models, deterministic medical scoring engines, and large language models (LLMs) requires rigorous architectural separation and safety boundaries. Without structured governance:
1. Algorithmic predictions risk being conflated with definitive medical diagnoses or autonomous prescriptions.
2. Clinical guidelines may be applied without documented provenance or verification status.
3. Patient Protected Health Information (PHI) could leak to external model contexts or vector indices.
4. Clinicians may lack transparent mechanisms to review, concur with, or override automated risk stratifications.
5. Out-of-distribution or conflicting clinical data could lead to silent failures rather than explicit uncertainty states.

---

## 2. Decision & Architectural Principles

We implement a production-grade **Clinical Knowledge, Guideline Management, AI Safety, and Human-in-the-Loop Platform** across backend, database, and frontend tiers.

### 2.1 Explicit 8-Layer Domain Separation
The system strictly separates 8 distinct architectural layers:
1. **Clinical Data**: Bedside vitals, laboratory results, encounter demographics stored in Neon PostgreSQL.
2. **ML Predictions**: Calibrated risk scores (e.g. Random Forest, XGBoost) with 95% bootstrap confidence intervals, uncertainty scoring, and inference latency.
3. **Deterministic Clinical Rules**: Evidence-based deterministic scores (qSOFA, NEWS2, acute critical lab thresholds) that execute deterministically and take precedence over statistical models.
4. **Clinical Guidelines**: Versioned, approved clinical practice guidelines (AHA/ACC, SSC-2021, KDIGO, RCP NEWS2) with multi-stage approval (DRAFT $\rightarrow$ APPROVED $\rightarrow$ PUBLISHED $\rightarrow$ DEPRECATED).
5. **Evidence & Document Sources**: Authoritative publication registries with trust levels (TIER_1_CLINICAL, TIER_2_CONSENSUS, TIER_3_OBSERVATIONAL) and provenance verification badges (`VERIFIED` vs `SOURCE NOT VERIFIED`).
6. **AI-Generated Explanations**: TreeSHAP feature attributions and guideline cross-referencing, strictly labeled with medical non-causation disclaimers.
7. **Human Decisions**: Clinician review sign-offs (`CONCUR`, `OVERRIDE`, `REQUEST_LABS`, `TRANSFER_ICU`) requiring mandatory clinical rationales and structured justification codes on override.
8. **System & Infrastructure Events**: Audited operational events, kill-switch triggers, and database migrations.

### 2.2 10-Stage Policy-Governed AI Safety Gate
All clinical AI queries and assistive interactions pass through a centralized 10-stage pipeline:
- **Stage 1 (Kill-Switch Check)**: Immediate fail-closed blocking if emergency stop is active.
- **Stage 2 (Role & RBAC Authorization)**: Validates user permissions against clinical role boundaries.
- **Stage 3 (Input PHI Redaction)**: Scans and redacts direct patient identifiers (SSN, MRN, phone, full names) before inference.
- **Stage 4 (Prompt Injection Defense)**: Detects adversarial attempts to hijack instructions, reverse roles, or bypass guardrails.
- **Stage 5 (Deterministic Clinical Pre-Check)**: Evaluates deterministic rules (qSOFA, NEWS2, critical thresholds) before AI synthesis.
- **Stage 6 (Guideline & Retrieval Grounding)**: Ensures all retrieved clinical literature stems from verified documents. Unverified sources trigger `SOURCE NOT VERIFIED`.
- **Stage 7 (Controlled Model Execution)**: Invokes calibrated models or approved LLM endpoints with temperature control and timeout protection.
- **Stage 8 (Output PHI Redaction)**: Scans output text for synthetic or leaked identifiers.
- **Stage 9 (Autonomous Diagnosis Blocking & SaMD Disclaimer)**: Rewrites or suppresses assertive diagnostic statements and appends FDA SaMD Class II advisory notices.
- **Stage 10 (Immutable PostgreSQL Audit Logging)**: Records an immutable `AISafetyEvent` and `AuditLog` entry in Neon PostgreSQL.

### 2.3 Uncertainty States
The AI Safety Gate and CDSS engine explicitly emit six distinct epistemic uncertainty states:
- `SUPPORTED`: Validated against high-confidence guidelines and complete vitals.
- `PARTIALLY_SUPPORTED`: Guideline-aligned but partial vitals/labs available.
- `INSUFFICIENT_DATA`: Missing critical parameters required for scoring; prompts for additional labs.
- `CONFLICTING_DATA`: Discordance between deterministic rule and ML prediction; triggers mandatory physician review.
- `NOT_SUPPORTED`: No validated guideline supports the query; advisory suppressed.
- `REQUIRES_CLINICIAN_REVIEW`: Elevated risk or entropy requiring immediate human bedside review.

### 2.4 Human-in-the-Loop (HITL) Sign-Off
- Clinicians can concur, override, request additional laboratory tests, or escalate to ICU.
- **Mandatory Clinical Rationale**: When selecting `OVERRIDE`, the system enforces a non-empty clinical rationale and structured justification reason (e.g. `TRANSIENT_PHYSIOLOGICAL_FACTOR`, `KNOWN_CHRONIC_BASELINE`, `LAB_ARTIFACT_OR_HEMOLYZED`).
- Overrides update both the prediction record and the immutable audit trail with clinician identity and timestamp.

### 2.5 Authoritative Store & Zero PHI in Vector Stores
- Neon PostgreSQL is the sole authoritative source of truth.
- Zero patient PHI is stored in agent memory or shared vector indices. Context minimization extracts only normalized vitals and clinical observations.

---

## 3. Consequences

### Positive
- **Regulatory Compliance**: Aligns with FDA SaMD Class II guidance, 21 CFR Part 11 audit trail defensibility, and HIPAA privacy rules.
- **Patient Safety**: Prevents autonomous diagnostic errors, ensures deterministic overrides take precedence, and enforces human sign-off.
- **Trust & Explainability**: Transparent 5-part separation view in the Doctor Workspace allows clinicians to inspect model probability, deterministic rules, guideline citations, TreeSHAP drivers, and human decisions at a glance.
- **Maintainability**: Clear service boundaries (`ClinicalKnowledgeService`, `AISafetyGate`, `ClinicalRulesEngine`, `PatientTimelineService`).

### Trade-offs
- Overrides require attending clinicians to type a clinical rationale, adding slight interaction overhead (justified by patient safety and 21 CFR Part 11 defensibility).
- Emergency kill-switch halts AI operations in a fail-closed manner, requiring fallback to standard deterministic clinical rules.
