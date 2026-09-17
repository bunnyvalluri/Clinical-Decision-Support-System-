# Healthcare CDSS End-to-End Traceability Matrix

> **Traceability Standard**: Every clinical and engineering requirement maps bi-directionally across:
> $\text{Requirement ID} \to \text{Specification} \to \text{Implementation Plan} \to \text{Actionable Task} \to \text{Code Implementation} \to \text{Automated Test} \to \text{Convergence Status}$

---

## 1. Traceability Table

| Requirement ID | Description | Spec Document | Plan Ref | Task ID | Code Location | Automated Test | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`FR-PRED-001`** | Multi-class risk prediction (`LOW`/`MED`/`HIGH`) | `specs/features/patient-risk-prediction/spec.md` | `plan.md#Layer-3` | `T-API-001` | `backend/apps/predictions/services.py` | `backend/apps/predictions/tests/test_services.py` | `CONVERGED` |
| **`FR-PRED-002`** | TreeSHAP feature attributions computation | `specs/features/patient-risk-prediction/spec.md` | `plan.md#Layer-3` | `T-ML-001` | `ml/explainability/shap_explainer.py` | `backend/apps/predictions/tests/test_services.py` | `CONVERGED` |
| **`FR-PRED-003`** | Clinician review sign-off workflow | `specs/features/patient-risk-prediction/spec.md` | `plan.md#Layer-1` | `T-DB-003` | `backend/apps/predictions/models.py` | `backend/apps/predictions/tests/test_services.py` | `CONVERGED` |
| **`FR-PRED-004`** | Missing vitals validation & rejection | `specs/features/patient-risk-prediction/spec.md` | `plan.md#Layer-2` | `T-API-001` | `backend/apps/predictions/services.py` | `backend/apps/predictions/tests/test_services.py` | `CONVERGED` |
| **`FR-PRED-005`** | Deterministic qSOFA $\ge 2$ safety override | `specs/features/patient-risk-prediction/spec.md` | `plan.md#Layer-2` | `T-API-002` | `backend/apps/predictions/services.py` | `backend/apps/predictions/tests/test_qsofa_override.py` | `CONVERGED` |
| **`FR-PRED-006`** | Cross-patient prediction IDOR prevention | `specs/features/patient-risk-prediction/spec.md` | `plan.md#Layer-2` | `T-API-003` | `backend/apps/predictions/permissions.py` | `backend/apps/predictions/tests/test_permissions.py` | `CONVERGED` |
| **`FR-AI-001`** | Ollama / AI Gateway decision support chat | `specs/features/doctor-ai-assistant/spec.md` | `plan.md#Layer-3` | `T-API-004` | `backend/apps/ai_agents/views.py` | `bruno/ai/doctor_assistant.bru` | `CONVERGED` |
| **`FR-AI-002`** | Allowlisted tool execution gate | `specs/features/doctor-ai-assistant/spec.md` | `plan.md#Layer-1` | `T-API-001` | `backend/apps/ai_orchestrator/tools.py` | `backend/apps/ai_orchestrator/tests/test_tools.py` | `CONVERGED` |
| **`FR-AI-003`** | Multi-tier prompt injection defense | `specs/features/doctor-ai-assistant/spec.md` | `plan.md#Layer-2` | `T-API-002` | `backend/apps/ai_orchestrator/security.py` | `backend/apps/ai_orchestrator/tests/test_injection.py` | `CONVERGED` |
| **`FR-AI-004`** | Meilisearch clinical guideline RAG | `specs/features/doctor-ai-assistant/spec.md` | `plan.md#Layer-2` | `T-API-003` | `backend/apps/search/services.py` | `backend/apps/search/tests/test_guideline_retrieval.py`| `CONVERGED` |
| **`FR-AI-005`** | Prohibit autonomous diagnosis/prescription | `specs/features/doctor-ai-assistant/spec.md` | `plan.md#Constitution`| `T-GATE-001`| `backend/apps/ai_orchestrator/prompts.py`| `backend/apps/ai_orchestrator/tests/test_injection.py` | `CONVERGED` |
| **`FR-PATIENT-001`**| Patient personal vitals & trend view | `specs/frontend/FRONTEND-SPEC.md` | `plan.md#Layer-5` | `T-FE-001` | `frontend/src/app/(portals)/user/page.tsx` | Playwright User E2E | `CONVERGED` |
| **`FR-DOCTOR-001`** | Doctor patient cohort risk dashboard | `specs/frontend/FRONTEND-SPEC.md` | `plan.md#Layer-5` | `T-FE-001` | `frontend/src/app/(portals)/doctor/page.tsx` | Playwright Doctor E2E | `CONVERGED` |
| **`FR-NURSE-001`**  | Nurse bedside vital entry & alert stream | `specs/frontend/FRONTEND-SPEC.md` | `plan.md#Layer-5` | `T-FE-001` | `frontend/src/app/(portals)/nurse/page.tsx` | Playwright Nurse E2E | `CONVERGED` |
| **`FR-INFORMATICIST-001`**| Informaticist model calibration & drift | `specs/ml/ML-GOVERNANCE-SPEC.md` | `plan.md#Layer-5` | `T-FE-001` | `frontend/src/app/(portals)/informaticist/page.tsx` | Playwright Informaticist E2E | `CONVERGED` |
| **`FR-ADMIN-001`**  | Admin infrastructure & audit log console | `specs/frontend/FRONTEND-SPEC.md` | `plan.md#Layer-5` | `T-FE-001` | `frontend/src/app/(portals)/admin/page.tsx` | Playwright Admin E2E | `CONVERGED` |
| **`NFR-SEC-001`**   | Multi-tier authorization (`HasPatientAccess`)| `specs/security/SECURITY-PRIVACY-SPEC.md` | `plan.md#Constitution`| `T-API-003`| `backend/apps/patients/permissions.py` | `backend/apps/predictions/tests/test_permissions.py` | `CONVERGED` |
| **`NFR-SEC-002`**   | Zero-PHI context minimization | `specs/security/SECURITY-PRIVACY-SPEC.md` | `plan.md#Constitution`| `T-API-001`| `backend/ai/context/builder.py` | `backend/apps/ai_orchestrator/tests/test_privacy.py` | `CONVERGED` |
| **`NFR-PERF-001`**  | API latency budget ($P95 < 200\text{ms}$) | `specs/architecture/SYSTEM-ARCHITECTURE-SPEC.md`| `plan.md#Layer-2` | `T-TEST-003`| `backend/config/middleware.py` | `backend/tests/test_performance.py` | `CONVERGED` |
| **`NFR-DESIGN-001`**| Strict White / Light theme only | `specs/frontend/FRONTEND-SPEC.md` | `plan.md#Layer-5` | `T-FE-002` | `frontend/src/app/globals.css` | React Doctor / Theme Lint | `CONVERGED` |
| **`NFR-A11Y-001`**  | WCAG 2.1 AA accessibility compliance | `specs/frontend/FRONTEND-SPEC.md` | `plan.md#Layer-5` | `T-TEST-004`| `frontend/src/components/ui/` | React Doctor / Axe Core | `CONVERGED` |
| **`RT-001`**        | Post-commit WebSocket broadcast guard | `specs/realtime/REALTIME-CHANNELS-SPEC.md`| `plan.md#Layer-3` | `T-RT-001` | `backend/apps/predictions/services.py` | `backend/channels_app/tests/test_consumers.py` | `CONVERGED` |
| **`DB-001`**        | Neon PostgreSQL sole clinical source of truth | `specs/database/DATABASE-SPEC.md` | `plan.md#Layer-1` | `T-DB-001` | `backend/apps/clinical/models.py` | `backend/apps/clinical/tests/test_models.py` | `CONVERGED` |
| **`AUDIT-001`**     | Tamper-evident PostgreSQL audit trail | `specs/security/SECURITY-PRIVACY-SPEC.md` | `plan.md#Layer-1` | `T-DB-003` | `backend/apps/audit/models.py` | `backend/apps/audit/tests/test_audit.py` | `CONVERGED` |
| **`CLINICAL-001`**  | Clinical safety sign-off & no auto diagnosis| `specs/clinical/CLINICAL-SAFETY-SPEC.md` | `plan.md#Constitution`| `T-GATE-001`| `backend/apps/predictions/models.py` | `backend/apps/predictions/tests/test_services.py` | `CONVERGED` |
| **`FR-FC-001`**     | Firecrawl Web Intelligence Provider & RAG Ingestion | `specs/integrations/FIRECRAWL-WEB-INTELLIGENCE-SPEC.md` | `plan.md#Firecrawl` | `T-FC-001` | `backend/integrations/firecrawl/service.py` | `backend/tests/test_firecrawl_integration.py` | `CONVERGED` |
| **`FR-FC-002`**     | Multi-tier SSRF & Prompt Injection Quarantine | `specs/integrations/FIRECRAWL-WEB-INTELLIGENCE-SPEC.md` | `plan.md#Firecrawl` | `T-FC-002` | `backend/integrations/firecrawl/security.py` | `backend/tests/test_firecrawl_integration.py` | `CONVERGED` |
| **`FR-FC-003`**     | Asynchronous Crawl & Batch Celery State Machine | `specs/integrations/FIRECRAWL-WEB-INTELLIGENCE-SPEC.md` | `plan.md#Firecrawl` | `T-FC-003` | `backend/apps/web_intelligence/tasks.py` | `backend/tests/test_firecrawl_integration.py` | `CONVERGED` |
| **`FR-FC-004`**     | Role-Scoped White-Only Web Intelligence UI | `specs/integrations/FIRECRAWL-WEB-INTELLIGENCE-SPEC.md` | `plan.md#Firecrawl` | `T-FC-004` | `frontend/src/app/doctor/research/page.tsx` | Playwright E2E & Theme Lint | `CONVERGED` |
