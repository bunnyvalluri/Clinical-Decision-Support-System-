# Notifications API

Endpoints for managing clinical alerts and emergency triage notifications.

---

## 1. Endpoints

### 1.1 `GET /api/v1/notifications/`
Lists alerts for the authenticated clinician, filterable by `is_read=false` and `severity=CRITICAL`.

### 1.2 `POST /api/v1/notifications/{id}/read/`
Marks a specific emergency notification as acknowledged.
