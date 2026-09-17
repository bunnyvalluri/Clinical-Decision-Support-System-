# Clinical AI Operations, Diagnostics & Runbooks

## 1. Service Dependencies
The AI Agent subsystem relies on the following services:
- **Neon PostgreSQL**: Primary authoritative store for tables `agent_definitions_v2`, `agent_sessions`, `agent_executions`, `agent_tool_executions`, `agent_approvals`.
- **Ollama Private Cluster**: Local LLM inference (`medllama3:latest`) via `http://localhost:11434` or configured internal gateway.
- **Django Channels / Daphne**: WebSocket message broadcasting on `ws/ai/agent/<session_id>/`.
- **Redis & Celery**: Asynchronous execution workers and periodic drift checks.

## 2. Health Check & Diagnostics
The system diagnostic tool `get_service_health_diagnostics` inspects connectivity to all dependent services and can be invoked programmatically or by an Administrator.

To run diagnostic checks manually:
```bash
python manage.py check --settings=config.settings.development
```

## 3. Human Approval Queue Operations
Pending approvals can be inspected via REST:
```bash
GET /api/v1/ai/agents/approvals/?status=REQUESTED
```
Clinicians approve or reject via:
```bash
POST /api/v1/ai/agents/approvals/<approval_id>/decide/
{
  "decision": "APPROVED",
  "rationale": "Clinical evaluation concurs with protocol recommendation."
}
```
Execution resumes immediately upon approval.
