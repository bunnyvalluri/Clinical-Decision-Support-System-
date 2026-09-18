# Google Jules Engineering Automation Runbook

This runbook provides step-by-step procedures for operating, troubleshooting, and administering the Google Jules automation subsystem in HealthNova AI.

---

## 1. Daily Operations & Monitoring

### Health Verification
1. Navigate to **IT Admin Portal** -> **Jules Automation** (`/admin/automation/jules`).
2. Verify the **Subsystem Health Card**:
   - Status should be `HEALTHY` or `CONFIG_ERROR` (if API key not configured yet).
   - Circuit Breaker should indicate `CLOSED` (0 consecutive failures).
   - Neon PostgreSQL Connection should show active connection pool.

### Automated CI Failure Ingestion
When a CI run fails:
1. GitHub Actions / Coolify webhook triggers `/api/v1/automation/jules/webhook/`.
2. A `JulesRemediationJob` is automatically created with category `CI_FAILURE` or `BUILD_FAILURE`.
3. If `JULES_REQUIRE_PLAN_APPROVAL=true`, the job will pause in `PLAN_PENDING_APPROVAL`.
4. IT Admins receive a real-time notification on `/admin/automation/jules`.

---

## 2. Reviewing and Authorizing a Remediation Plan

1. Navigate to `/admin/automation/jules/remediations/`.
2. Select the remediation job with status `PLAN_PENDING_APPROVAL`.
3. Review:
   - **Target Branch**: Ensure it is a feature branch (`jules/*`) and NOT `main` or `production`.
   - **Proposed Changes**: Review files affected. Ensure zero clinical files (`ml/`, `risk_scoring/`).
   - **Error Log**: Inspect sanitized stack traces.
4. Click **Authorize Plan** in the top action bar.
5. In the dual-custody dialog, enter audit notes (e.g. `Approved following PR review of issue #412`) and confirm.
6. The backend transitions the job to `EXECUTING` and instructs Jules to implement the patch.

---

## 3. Troubleshooting & Failure Recovery

### Circuit Breaker Tripped (`OPEN`)
- **Symptom**: New remediation requests return `503 Service Unavailable` with `Circuit breaker is OPEN`.
- **Root Cause**: 5 consecutive network timeouts or 5xx errors connecting to `jules.googleapis.com`.
- **Action**:
  1. Inspect network connectivity to Google Cloud APIs.
  2. Verify quota and billing status for the Jules API project.
  3. Reset the circuit breaker via Django management command:
     ```bash
     python manage.py jules_reset_circuit_breaker
     ```
     or wait for the 300-second cooldown period to enter `HALF_OPEN`.

### GitHub Source Sync Failure
- **Symptom**: `/admin/automation/jules/sources` shows no connected repositories.
- **Action**:
  1. Check `JULES_GITHUB_INTEGRATION_TOKEN` in `.env` / Coolify secrets.
  2. Click **Sync GitHub Sources** in the UI to trigger a fresh repository poll.
  3. Verify repository names in `JULES_ALLOWED_REPOSITORIES`.

### Emergency Kill Switch
If an automated remediation session behaves abnormally:
1. Click **Emergency Cancel** on the active session page (`/admin/automation/jules/sessions/[sessionId]`).
2. Alternatively, set in `.env`:
   ```bash
   JULES_ENABLED=false
   ```
   and restart backend containers. All in-flight jobs will gracefully abort.
