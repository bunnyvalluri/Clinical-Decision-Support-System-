# WebSocket API Protocol

Specifications for real-time WebSocket communication over `/ws/dashboard/` and `/ws/alerts/`.

---

## 1. Handshake & Authentication

Clinicians connect via:
`wss://cdss.hospital.org/ws/dashboard/?token=<access_jwt>`

The ASGI `JwtAuthMiddleware` extracts the token from query parameters, validates signature and expiration, and binds the authenticated `User` object to the connection `scope`.

---

## 2. Event Messages

### 2.1 `prediction_created`
Broadcast when a new prediction is persisted:
```json
{
  "type": "prediction_created",
  "payload": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_name": "Eleanor Ward",
    "risk_level": "HIGH",
    "probability": 0.842,
    "created_at": "2026-09-13T16:20:00Z"
  }
}
```

### 2.2 `task_status_updated`
Broadcast when a Celery background job changes state:
```json
{
  "type": "task_status_updated",
  "payload": {
    "task_id": "uuid",
    "task_name": "generate_pdf_report",
    "status": "COMPLETED",
    "progress": 100,
    "result": {
      "download_url": "/api/v1/reports/uuid/download/"
    }
  }
}
```
