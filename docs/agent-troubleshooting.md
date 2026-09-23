# Browser Agent Troubleshooting Guide

## Common Issues & Resolutions

### 1. `LAYA_AGENT_NOT_AVAILABLE`
- **Symptom**: Runtime status displays `UNAVAILABLE` or `LAYA_AGENT_NOT_AVAILABLE`.
- **Cause**: The current host is not Apple Silicon (e.g. standard Linux x86 or Windows server) and no external `LAYA_SERVICE_URL` is configured.
- **Resolution**: This is normal and expected on non-macOS hardware. Core clinical systems (prediction engine, FHIR, patient risk timeline) continue functioning normally. If live browser automation is needed, either deploy on Apple Silicon with `laya-mlx` or point `LAYA_SERVICE_URL` to an external Laya container.

### 2. `AGENT_DISABLED`
- **Symptom**: New tasks fail with `AGENT_DISABLED: Emergency kill switch active`.
- **Cause**: The operational kill switch was activated.
- **Resolution**: Inspect the audit log to determine who activated the kill switch and why. Once verified safe, deactivate via the Kill Switch button in `/admin/ai-agents` or `POST /api/v1/ai-agents/browser/kill-switch/` with `is_active=false`.

### 3. `Domain is not in the approved destinations allowlist`
- **Symptom**: Task is blocked with status `BLOCKED`.
- **Cause**: The requested domain has not been allowlisted.
- **Resolution**: Review the domain for clinical relevance and security. If legitimate, add it to `ApprovedDestination` via the admin console.

### 4. `Independent verification FAILED: Expected text not found`
- **Symptom**: Task reached end of workflow but marked `FAILED`.
- **Cause**: The destination page did not render the expected post-condition text.
- **Resolution**: Inspect the `steps_log` and `audit_reference` in `/admin/ai-agents` to see what content the page returned.
