# Security & Privacy Requirements: Doctor AI Clinical Assistant

**Feature ID**: `FEAT-AI-002`  
**Status**: `CONVERGED`  

---

## 1. Prompt Injection Defenses
- Strict demarcation separating system instructions, untrusted retrieved context, and user input.
- Semantic and regex scanner filtering common jailbreak and instruction-override tokens.
- Default-deny tool execution sandbox.

---

## 2. Privacy & Zero-PHI Quarantine
- All inputs are filtered through `ClinicalRiskContextBuilder` ensuring zero unredacted patient identifiers reach the model or logs.
- AI request traces record token counts, latency, and sanitized tool logs in Neon PostgreSQL table `ai_agent_traces`.

---

## 3. Scoped Authorization
- Accessible strictly by authenticated clinicians holding the `Doctor` role.
- Model cannot access patients without active clinical assignment verification.
