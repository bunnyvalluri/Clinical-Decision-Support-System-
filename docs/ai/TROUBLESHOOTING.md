# Clinical AI Troubleshooting & Error Code Guide

## 1. Common Operational Errors & Solutions

### `AI_REQUEST_FAILED` / `AI_AGENT_ERROR`
- **Cause**: Local Ollama server down or model not pulled.
- **Remediation**: Check service vitality via `GET /api/v1/ai/providers/ollama/health`. Ensure `medllama3:latest` is loaded via `ollama list`.

### `DENIED_PATIENT_ISOLATION` (HTTP 403)
- **Cause**: Clinician attempting to access patient clinical data without an active clinical assignment or authorization.
- **Remediation**: Verify user permissions and patient scope in `apps.accounts.models.RolePermission`.

### `WAITING_APPROVAL` / Execution Paused
- **Cause**: The agent proposed a high-risk action (e.g. ICU transfer, diagnostic panel escalation).
- **Remediation**: This is expected behavior. An authorized physician or triage supervisor must review the action in `/doctor/ai-assistant` and submit an approval or rejection.

### `PROMPT_INJECTION_DETECTED` (HTTP 400)
- **Cause**: An adversarial prompt pattern was detected by `SafetyService`.
- **Remediation**: Rephrase query using clinical and observational terminology. All injection attempts are logged in `AgentSafetyEvent`.

### `SAFE_DEGRADED_MODE`
- **Cause**: Local Ollama inference failed while evaluating a prompt with patient context. The PHI firewall prevented fallback to external cloud APIs to protect patient privacy.
- **Remediation**: Restart local Ollama cluster. The agent will resume normal operations without exposing PHI.
