# REST API Overview & Conventions

The PatientRisk CDSS API follows RESTful architecture principles, versioned under `/api/v1/`.

---

## 1. Standard Response Envelope

All endpoints return a uniform envelope structure:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-13T16:00:00.000Z"
  }
}
```

### Asynchronous Queued Response (`202 Accepted`)
```json
{
  "success": true,
  "data": {
    "task_id": "c67c29de-dc33-48d4-8632-d13955d24ea4",
    "status": "QUEUED",
    "message": "Report generation enqueued successfully."
  }
}
```

### Error Response (`4xx`, `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Measurement out of acceptable clinical range.",
    "details": {
      "heart_rate": ["Heart rate must be between 20 and 300 bpm."]
    }
  }
}
```
