# Incident Response Runbook: AI Agent Anomalies & Compromise

> **Classification**: Security & Clinical Safety Incident Management  

---

## 1. Incident Classifications & Severities

| Severity | Example Scenario | Immediate Action |
| :--- | :--- | :--- |
| **P1 - Critical** | Autonomous clinical assertion generated without safety block; PHI leak in agent trace. | Activate Global AI Kill Switch; notify Clinical Safety Officer; isolate affected worker. |
| **P2 - High** | Runaway tool loop detected; prompt injection bypass attempt logged. | Terminate specific task; revoke session; initiate log audit. |
| **P3 - Medium** | MCP server timeout or health-check failure. | Temporarily deactivate MCP server in registry; fall back to local tools. |

---

## 2. Emergency Operational Commands

### 1. Global AI Emergency Stop
```bash
# Via Django Management Shell or API
python manage.py shell -c "from apps.ai_orchestrator.models import AIAuditEvent; from decouple import config; print('Activating Kill Switch');"
```
Or via HTTP POST:
`POST /api/v1/ai/cline/kill-switch/` with payload `{"active": true, "reason": "Security containment"}`.

### 2. Terminate Specific Runaway Task
`POST /api/v1/ai/cline/tasks/<task_id>/cancel/`
