# Google Jules API Bruno Collection

This collection tests the Google Jules REST integration endpoints mounted on HealthNova AI's authenticated Django backend.

## Endpoints Tested
- `JULES-HEALTH-001.bru`: `/api/v1/automation/jules/health/` (System health, circuit breaker state)
- `JULES-SOURCES-001.bru`: `/api/v1/automation/jules/sources/` (List registered GitHub sources)
- `JULES-SESSIONS-001.bru`: `/api/v1/automation/jules/sessions/` (List active and finished Jules sessions)
- `JULES-REMEDIATIONS-001.bru`: `/api/v1/automation/jules/remediations/` (List remediation tasks)
- `JULES-SETTINGS-001.bru`: `/api/v1/automation/jules/settings/` (View configuration limits and circuit breaker)
- `JULES-ACTIVITY-001.bru`: `/api/v1/automation/jules/activity/` (View immutable audit trail)

## Security Requirements
- Requires `admin_access_token` (`IT_ADMIN` or `ADMIN` role).
- Zero direct browser calls to `jules.googleapis.com`.
