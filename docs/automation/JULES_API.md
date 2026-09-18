# Google Jules Integration REST API Reference

All Jules endpoints are mounted under `/api/v1/automation/jules/` and require JWT Bearer authentication with role `IT_ADMIN` or `ADMIN`.

---

## 1. System Health & Diagnostics

### `GET /api/v1/automation/jules/health/`
Returns current operational status, circuit breaker telemetry, and active worker counts.

**Response `200 OK`:**
```json
{
  "status": "HEALTHY",
  "version": "v1alpha",
  "circuit_breaker": {
    "state": "CLOSED",
    "failure_count": 0,
    "last_failure_time": null,
    "is_open": false
  },
  "active_sessions_count": 1,
  "pending_approvals_count": 0,
  "sources_count": 2,
  "database_connected": true,
  "timestamp": "2026-09-18T05:10:00Z"
}
```

---

## 2. GitHub Sources

### `GET /api/v1/automation/jules/sources/`
Lists all connected GitHub repositories registered with Google Jules.

### `POST /api/v1/automation/jules/sources/sync/`
Forces a synchronization run against GitHub to discover new branches and repository metadata.

---

## 3. Jules Sessions

### `GET /api/v1/automation/jules/sessions/`
Lists all active, completed, or failed Jules sessions.

### `POST /api/v1/automation/jules/sessions/`
Spawns a new direct Jules coding session.

**Request Payload:**
```json
{
  "source_id": "sources/github/healthnova/cdss",
  "prompt": "Investigate why Next.js Turbopack cache fails on cold boot in staging.",
  "title": "Turbopack Cold Boot Investigation"
}
```

### `GET /api/v1/automation/jules/sessions/<id>/`
Fetches session details, including state machine progression and artifacts.

### `POST /api/v1/automation/jules/sessions/<id>/message/`
Sends a mid-session prompt, instruction, or clarification to Jules.

---

## 4. Remediation Jobs

### `GET /api/v1/automation/jules/remediations/`
Queries the list of remediation jobs with optional filtering by `status`, `severity`, or `issue_category`.

### `POST /api/v1/automation/jules/remediations/`
Initiates an automated remediation pipeline.

**Request Payload:**
```json
{
  "title": "Fix TypeScript error in user profile avatar loader",
  "issue_category": "TYPESCRIPT_ERROR",
  "description": "Property 'avatar_url' does not exist on type 'UserProfileDTO'",
  "repository": "bunnyvalluri/Clinical-Decision-Support-System-",
  "branch": "jules/fix-avatar-ts-error",
  "severity": "MEDIUM",
  "affected_files": ["frontend/src/types/user.ts", "frontend/src/components/UserAvatar.tsx"]
}
```

### `POST /api/v1/automation/jules/remediations/<id>/approve/`
Authorizes an implementation plan for execution.

**Request Payload:**
```json
{
  "reason": "Reviewed proposed diff. No clinical logic touched. Approved."
}
```

### `POST /api/v1/automation/jules/remediations/<id>/cancel/`
Cancels an ongoing remediation job.

---

## 5. Webhooks

### `POST /api/v1/automation/jules/webhook/`
Ingests CI/CD failure events from GitHub Actions or Coolify. Requires HMAC-SHA256 signature in header `X-Hub-Signature-256`.
