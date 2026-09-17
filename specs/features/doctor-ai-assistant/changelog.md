# Feature Changelog: Doctor AI Clinical Assistant

**Feature ID**: `FEAT-AI-002`  

---

## [1.0.0] - 2026-09-17
### Added
- Integrated Doctor AI Assistant with Ollama local runtime and AI Gateway fallback.
- Multi-tier prompt injection defense separating System, Context, and User boundaries.
- Allowlisted tool execution (`get_patient_context`, `run_risk_prediction`, `retrieve_approved_knowledge`).
- Meilisearch hybrid RAG retrieval for institutional clinical protocols with citations.
- Persistent non-diagnostic disclaimer and refusal of autonomous prescription requests.
- Slide-over white-themed drawer component in Next.js using shadcn/ui.
- Comprehensive automated penetration tests for prompt injection.
