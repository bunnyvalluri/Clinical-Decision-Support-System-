# Architecture Specification: Controlled Cline Integration

> **System**: HealthNova AI Clinical Decision Support System (BPY-CSE-2666)  
> **Component**: Cline Agent Engine Architecture & Pipeline  

---

## 1. End-to-End Request Pipeline

```
Next.js UI (Doctor / Nurse / Informaticist / Admin)
    |
    | (1) POST /api/v1/ai/cline/tasks/ (JWT Bearer + Correlation ID)
    v
Django REST API (apps.ai_orchestrator)
    |
    | (2) Authenticate user, evaluate RBAC, enforce Rate Limits
    v
AI Gateway (ai.gateway)
    |
    | (3) Scan prompt for injection (AISafetyEngine)
    | (4) Redact Protected Health Information (PHIRedactor)
    | (5) Check Token & Cost Budgets (BudgetService)
    v
Celery Background Queue ("agent_tasks")
    |
    | (6) Dispatch to isolated Celery worker
    v
ClineAgentAdapter (backend/integrations/cline/adapter.py)
    |
    | (7) Decompose task, initialize AgentSession
    | (8) Query LLM via AI Gateway Provider Router (OpenAI/Anthropic/Ollama)
    v
Tool Evaluation & Approval Gate
    |
    +---> Low Risk? ---> Sandboxed Tool Execution (SandboxedExecutionEngine)
    |
    +---> High Risk? ---> Status: WAITING_FOR_APPROVAL ---> Notify Clinician / Admin
                                                                 |
                                                          Human Approves?
                                                           /          \
                                                       YES             NO
                                                       /                \
                                                Execute Tool      Abort Task
    |
    | (9) Post-execution safety inspection
    | (10) Persist immutable audit log to Neon PostgreSQL
    | (11) Stream safe summary event over Django Channels WebSocket
    v
Client Receives Real-time Updates (ws://host/ws/ai/)
```

---

## 2. Component Directory Layout

- `backend/integrations/cline/`:
  - `adapter.py`: Core execution adapter.
  - `session_service.py`: Session lifecycle, state machine, and persistence.
  - `tool_registry.py`: Declarative tool allowlist and risk classification.
  - `policy_adapter.py`: Action level and permission mapping.
  - `audit_adapter.py`: PHI-scrubbed audit logging.
  - `event_adapter.py`: Real-time Django Channels dispatch.
  - `provider_adapter.py`: Multi-provider routing through AI Gateway.
  - `sandboxes.py`: Workspace filesystem and shell sandboxing.
- `backend/celery_tasks/cline_tasks.py`: Background job execution.
- `backend/apps/ai_orchestrator/`: Django models, serializers, views, and URLs.
