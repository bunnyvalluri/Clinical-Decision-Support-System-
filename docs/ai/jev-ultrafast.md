# Jev Ultrafast Browser Automation Runtime — Technical Specification & User Manual

## Overview
`Jev Ultrafast` is an optional, high-speed, controlled browser automation runtime integrated into the HealthNova AI clinical decision-support ecosystem. Built on Chrome DevTools Protocol (CDP) and derived from `browser-use/jev-ultrafast` (MIT License), Jev provides sub-50ms action cycles while strictly adhering to healthcare safety, privacy, and non-diagnostic invariants.

---

## 1. Architectural Architecture

```
Clinician / Informaticist UI
          ↓
Django REST Framework API (`/api/v1/ai/agents/browser/`)
          ↓
Safety Gateway (`BrowserAgentSafetyGateway`)
    ├── Destination Allowlist Check (`BrowserDestination`)
    ├── Pre-request DNS & SSRF Validation (RFC1918 & Cloud Metadata Blocking)
    ├── Task Policy Enforcement (`BrowserTaskPolicy`)
    └── Human Approval Gate (`BrowserApproval`)
          ↓
Browser Agent Gateway (`BrowserAgentGateway`)
    ├── Circuit Breaker / Kill Switches (`AgentKillSwitchState`)
    ├── Jev Ultrafast Provider (`JevUltrafastProvider`)
    └── Deterministic Sandbox Provider (`LayaSandboxProvider`)
          ↓
Jev Core Engine (`jev_core`)
    ├── In-page Snapshot (`snapshot.js`)
    ├── Numbered Element Action-Space
    ├── Structured Action Model (`model.py`)
    ├── Bounded Step Loop (`agent.py`)
    └── Single-Mutation Guard
          ↓
Verification Layer (`BrowserVerification`)
    └── Independent DOM State / Payload Verification ("DONE != SUCCESS")
          ↓
Authoritative Storage (Neon PostgreSQL) & Realtime Telemetry (Channels / WS)
```

---

## 2. Mandatory Healthcare Safety Invariants

1. **Sole Authoritative Store**: Neon PostgreSQL (`BrowserAgentTask`, `BrowserAgentRun`, `BrowserAgentAction`, `BrowserVerification`, `BrowserAgentAuditEvent`).
2. **Zero Clinical Prescriptions / Diagnoses**: Jev is strictly an execution runtime for UI navigation and structured data extraction. It has no authority to formulate or alter medical judgments.
3. **Single-Mutation Invariant**: In any given task run, at most one state mutation (such as a form submit or button click altering database state) is permitted. Consecutive mutations or blind retries are immediately blocked.
4. **Independent Verification**: A task marked `COMPLETED` by the agent is not deemed clinically valid until an independent verification engine validates the resulting DOM state or retrieved dataset against strict schema checks.
5. **Context Minimization & PHI Isolation**: Sensitive patient identifiers are never placed into unstructured web prompts. Screenshots are disabled by default (`capture_screenshots = False`).
6. **Default-Deny SSRF Defense**:
   - Loopback (`127.0.0.1`), link-local (`169.254.169.254`), and RFC1918 private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are blocked at pre-request DNS resolution.
   - HTTP redirects (301/302) are re-validated before following.
   - Only destinations configured in `BrowserDestination` and marked `is_active=True` are reachable.

---

## 3. Configuration & Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `BROWSER_AGENT_GLOBAL_ENABLED` | `True` | Master kill switch for all browser automation |
| `JEV_ENABLED` | `True` | Kill switch specific to the Jev runtime |
| `BROWSER_MUTATIONS_ENABLED` | `True` | Allows or disables state-altering mutations |
| `JEV_HEADLESS` | `True` | Runs Chromium/Chrome in headless mode |
| `JEV_STEP_TIMEOUT_MS` | `5000` | Maximum timeout per step |
| `JEV_MAX_STEPS_LIMIT` | `60` | Hard cap on total steps per run |
| `JEV_OFFLINE_MODE` | `False` | Deterministic offline mode for CI/CD test suites |

---

## 4. API Reference

- `GET /api/v1/ai/agents/browser/tasks/` — List all browser tasks
- `POST /api/v1/ai/agents/browser/tasks/` — Create new governed browser task
- `GET /api/v1/ai/agents/browser/tasks/<task_id>/` — Retrieve task status and actions
- `POST /api/v1/ai/agents/browser/tasks/<task_id>/execute/` — Trigger async Celery execution
- `POST /api/v1/ai/agents/browser/tasks/<task_id>/approve/` — Clinician sign-off
- `POST /api/v1/ai/agents/browser/tasks/<task_id>/reject/` — Reject task
- `POST /api/v1/ai/agents/browser/tasks/<task_id>/cancel/` — Cancel running task
- `GET /api/v1/ai/agents/browser/tasks/<task_id>/live/` — Live action steps and telemetry
- `GET /api/v1/ai/agents/browser/destinations/` — List approved destinations
- `POST /api/v1/ai/agents/browser/destinations/` — Authorize new destination
- `GET /api/v1/ai/agents/browser/kill-switch/` — Get circuit breaker status
- `POST /api/v1/ai/agents/browser/kill-switch/` — Toggle circuit breaker states
- `GET /api/v1/ai/agents/browser/evaluations/` — Benchmark metrics and safety statistics

---

## 5. Licensing & Attribution
Upstream repository: `https://github.com/browser-use/jev-ultrafast.git`  
License: MIT License (included in `backend/integrations/browser_agent/jev_core/LICENSE`).  
Ported and enhanced with healthcare boundary controls, SSRF defenses, and PostgreSQL persistence by HealthNova AI.
