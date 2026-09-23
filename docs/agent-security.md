# HealthNova AI Agent Security Architecture

## 1. Zero-Trust Security Perimeter
The browser automation subsystem is treated as an unprivileged, untrusted actor:
- **No Direct Database Access**: Never connect directly to Neon PostgreSQL, Redis, or Celery. All operations traverse Django REST APIs with JWT and object-level permissions.
- **SSRF Defense**: Destination URLs are resolved via DNS; all private, loopback, broadcast, and cloud metadata IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `fc00::/7`, `fe80::/10`) are strictly blocked.
- **Destination Allowlist**: Unknown domains are rejected with `BLOCKED`. Allowed domains are maintained in Neon PostgreSQL (`ApprovedDestination`).
- **PHI Default DENY**: Tasks containing potential PHI (e.g. MRN, SSN, patient identifiers) are rejected unless explicit compliance sign-off is established.
- **Prompt Injection Defense**: Goals are scanned for prompt override patterns (`ignore previous instructions`, `bypass safety`, `dump database`, etc.).
- **Mutation Safety**: Potentially state-mutating actions (form submit, delete, order) are never automatically retried upon failure.

## 2. Emergency Kill Switch
Administrators can activate an emergency kill switch at any time:
- Via REST endpoint: `POST /api/v1/ai-agents/browser/kill-switch/` with `is_active=true`
- Via UI: One-click "EMERGENCY KILL SWITCH" button in `/admin/ai-agents`
- Via Environment: `BROWSER_AGENT_GLOBAL_ENABLED=false`

When active, all active tasks and queued executions are immediately blocked with `AGENT_DISABLED`.
