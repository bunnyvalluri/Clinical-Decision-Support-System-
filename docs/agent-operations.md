# Browser Agent Operational Runbook

## Runtime Management
- Health Check Endpoint: `GET /api/v1/ai-agents/browser/health/`
- Tasks Endpoint: `GET /api/v1/ai-agents/browser/tasks/`
- Destinations Endpoint: `GET /api/v1/ai-agents/browser/destinations/`
- Kill Switch Endpoint: `POST /api/v1/ai-agents/browser/kill-switch/`

## Environment Variables
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `BROWSER_AGENT_GLOBAL_ENABLED` | `true` | Emergency operational kill switch |
| `LAYA_RUNTIME_MODE` | `auto` | Runtime mode: `auto`, `mlx`, `remote`, `sandbox` |
| `LAYA_SERVICE_URL` | `http://localhost:8090` | Endpoint of optional external Laya service |
| `BROWSER_HARNESS_HEADLESS` | `true` | Run browser in headless mode |
| `BROWSER_HARNESS_TIMEOUT_MS` | `30000` | Browser command execution timeout |

## Adding an Approved Domain
1. Log into `/admin/ai-agents`.
2. Select the **Approved Destinations** tab.
3. Click **Add Approved Destination** (or via `POST /api/v1/ai-agents/browser/destinations/`).
4. Provide domain, clinical/operational purpose, allowed operations, and PHI permission.
