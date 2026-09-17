# AI Assistant & RAG Specification

**Spec ID**: `AI-SPEC-001`  
**Domain**: Clinical Assistants, Ollama / AI Gateway, Prompt Injection, & RAG  
**Status**: `CONVERGED`  
**Inference Engines**: Ollama (Local Self-Hosted) / AI Gateway Provider Abstraction  
**Search / Knowledge Base**: Meilisearch Vector & BM25 Hybrid Index  

---

## 1. Non-Autonomous Decision Support Boundary

1. **Advisory Assistance Only**:
   - The AI Assistant assists clinicians with chart summarization, guideline search, and TreeSHAP interpretation.
   - The AI Assistant is **PROHIBITED** from:
     - Formulating an unreviewed medical diagnosis.
     - Recommending specific prescription dosages.
     - Committing clinical actions without human clinician approval.
2. **Deterministic Output Validation**:
   - All AI responses must conform to strict Pydantic JSON schemas.
   - Parsing failures or unstructured text fall back immediately to deterministic template representations.

---

## 2. Multi-Layer Prompt Injection Defense

```
[ Incoming Query ]
       │
       ▼
[ Layer 1: Prompt Sanitizer ] (Regex filter for override patterns like "Ignore prior instructions")
       │
       ▼
[ Layer 2: Context Minimizer ] (ClinicalRiskContextBuilder strips PII/PHI)
       │
       ▼
[ Layer 3: Boundary Partitioning ]
┌────────────────────────────────────────────────────────────┐
│ SYSTEM INSTRUCTIONS: Immutable system prompt               │
│ QUARANTINED RAG CONTEXT: Retrieved text marked UNTRUSTED   │
│ STRUCTURED PATIENT VITALS: Validated numeric parameters    │
│ USER QUERY: Sanitized clinician question                   │
└────────────────────────────────────────────────────────────┘
       │
       ▼
[ Layer 4: Tool Allowlist Gate ]
(Allowlist: get_patient_context, run_risk_prediction, retrieve_approved_knowledge)
       │
       ▼
[ Layer 5: Output Pydantic Validator ]
```

---

## 3. Grounded Retrieval-Augmented Generation (RAG)

1. **Approved Knowledge Base**:
   - Institutional clinical guidelines, sepsis bundles, qSOFA protocols, and AHA/ACC guidelines.
2. **Citation Requirement**:
   - Every assistant clinical statement must cite the source guideline document ID and section.
   - Hallucinated or uncited assertions are flagged as `UNGROUNDED_CLAIM`.
