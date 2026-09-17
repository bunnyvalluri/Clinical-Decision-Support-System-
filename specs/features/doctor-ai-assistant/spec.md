# Feature Specification: Doctor AI Clinical Assistant & RAG

**Feature ID**: `FEAT-AI-002`  
**Feature Branch**: `feat/doctor-ai-assistant`  
**Created**: 2026-09-17  
**Status**: `CONVERGED`  
**Change Level**: `Level 4 (Clinical / AI / Security Critical)`  
**Owner / Role**: Senior AI/Agent Engineer & Clinical Informatics Lead  
**Reviewers**: Clinical Safety Agent, Healthcare Security Agent, Privacy Agent  

---

## 1. Objectives & Rationale

### Business Objective
Reduce physician cognitive burden and documentation fatigue by providing a grounded, context-aware AI assistant capable of synthesizing patient vital trends, summarizing clinical histories, and retrieving validated clinical guidelines.

### Clinical Objective
Support attending physicians with structured clinical summaries and verified medical protocol references while strictly barring autonomous clinical decisions, unreviewed actions, or hallucinated advice.

> [!IMPORTANT]
> **Clinical Safety Invariant**: The Doctor AI Assistant MUST NOT independently diagnose diseases, order medical prescriptions, or alter clinical orders. All assistant output is advisory decision support requiring clinician sign-off.

---

## 2. User Personas & Role Governance

- **Doctor (`/doctor/*`)**:
  - *Allowed*: Query assistant regarding assigned patients, request protocol lookups via RAG, review TreeSHAP summaries, accept/edit draft clinical notes.
  - *Forbidden*: Using AI to generate unreviewed prescriptions or bypass patient authorization.
- **Other Roles (`/user/*`, `/nurse/*`, `/admin/*`)**:
  - Access to the Doctor AI Assistant endpoint is strictly restricted to authenticated clinicians holding the `Doctor` role.

---

## 3. Prioritized User Stories

### User Story 1 - Patient Vital History Synthesis (Priority: P1)
**As a** Doctor,  
**I want to** ask the AI assistant for a 24-hour physiological summary of an assigned patient,  
**So that** I can rapidly grasp deterioration trends without manually reading individual vital records.

- **Acceptance Scenario (Gherkin)**:
  - **Given** an authorized doctor viewing an assigned patient,
  - **When** the doctor asks "Summarize the vital trends over the past 24 hours",
  - **Then** the assistant invokes `get_patient_context(patient_id)`,
  - **And** returns a structured summary with vital trends and TreeSHAP attribution highlights,
  - **And** displays an explicit clinician review disclaimer.

### User Story 2 - Grounded Protocol Retrieval via Meilisearch RAG (Priority: P2)
**As a** Doctor,  
**I want to** query institutional sepsis management guidelines directly within the assistant,  
**So that** evidence-based clinical protocols can be reviewed at the point of care.

- **Acceptance Scenario (Gherkin)**:
  - **Given** an authorized doctor querying hospital protocols,
  - **When** the doctor asks for the institutional sepsis resuscitation protocol,
  - **Then** the assistant invokes `retrieve_approved_knowledge(query, domain='sepsis')`,
  - **And** returns the validated protocol text with exact document citations,
  - **And** flags any ungrounded assertions.

---

## 4. Requirements Specification

### Functional Requirements (FR)
- **`FR-AI-001`**: Assistant MUST use Ollama local LLM or approved AI Gateway provider.
- **`FR-AI-002`**: Assistant MUST execute only allowlisted tools (`get_patient_context`, `run_risk_prediction`, `retrieve_approved_knowledge`).
- **`FR-AI-003`**: Assistant MUST enforce multi-tier prompt injection defense (regex sanitization, boundary demarcation, Pydantic validation).
- **`FR-AI-004`**: Assistant MUST cite approved clinical guidelines for all protocol statements.
- **`FR-AI-005`**: Assistant MUST NOT perform autonomous diagnosis or prescribe medications.

### Non-Functional Requirements (NFR)
- **`NFR-SEC-002`**: Zero PHI in prompts or agent logs; inputs de-identified via `ClinicalRiskContextBuilder`.
- **`NFR-PERF-002`**: RAG context retrieval from Meilisearch MUST complete within $P95 < 150\text{ms}$.
- **`NFR-DESIGN-001`**: Assistant chat drawer MUST adhere strictly to the White/Light theme.
