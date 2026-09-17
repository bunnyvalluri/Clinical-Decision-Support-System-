# AI Assistant & RAG Specification: [ASSISTANT CAPABILITY]

**AI Spec ID**: `AI-[DOMAIN]-[SEQ]`  
**Target Assistant**: `[Doctor AI Assistant | Nurse Triage Copilot | Informaticist Assistant]`  
**Runtime Engine**: `[Ollama Local LLM | AI Gateway Managed Model]`  
**Data Classification**: `[LOW_SENSITIVITY | SENSITIVE | DE-IDENTIFIED]` (PHI strictly prohibited)  
**Human-in-the-Loop Required**: `YES (Mandatory Clinician Verification)`  

---

## 1. Scope & Allowed Capabilities
- **Allowed Capabilities**:
  - Patient vital signs summarization from structured database records
  - Medical guideline and hospital protocol retrieval via Meilisearch RAG
  - TreeSHAP prediction explanation formatting in human-readable terms
  - Clinical documentation drafting (requires clinician edit & approval)
- **Strictly Prohibited Actions**:
  - Autonomous diagnosis
  - Drug prescribing or dosing suggestions
  - Unreviewed record modification
  - Sending raw patient data to unapproved external cloud endpoints

---

## 2. Multi-Tier Prompt Injection Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ 1. SYSTEM PROMPT (Immutable, Trust Boundary: SYSTEM)        │
├─────────────────────────────────────────────────────────────┤
│ 2. RETRIEVED MEDICAL CONTEXT (Quarantined, Untrusted Data)  │
├─────────────────────────────────────────────────────────────┤
│ 3. STRUCTURED CLINICAL RECORD (Validated Pydantic Payload)  │
├─────────────────────────────────────────────────────────────┤
│ 4. USER INQUIRY (Sanitized, Filtered by Regex & Semantic)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tool Execution Allowlist & Schema Validation
All tool calls invoked by the model must be registered in the allowlist and validated with strict schemas:
- `get_patient_context(patient_id: UUID) -> PatientVitalsContext`
- `run_risk_prediction(patient_id: UUID, model_id: str) -> RiskPredictionResult`
- `retrieve_approved_knowledge(query: str, domain: str) -> List[ClinicalCitation]`

Unknown or arbitrary tools: **DEFAULT DENY**.

---

## 4. Structured Output Validation & Safe Failure
- **Output Schema**: Pydantic model enforcing structured fields: `summary`, `contributing_factors`, `citations`, `uncertainty_warning`.
- **Validation Failure Policy**: If model returns malformed JSON or hallucinates keys, system falls back to deterministic template view.
- **Audit Requirement**: Store prompt hash, model ID, execution duration, and tool execution traces in PostgreSQL table `ai_interactions`.
