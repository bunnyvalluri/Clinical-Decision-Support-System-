# Real-Time Event Catalog

Standard event formats dispatched over WebSockets:

---

## 1. `prediction_created`
Dispatched whenever a risk prediction is generated.
```json
{
  "type": "prediction_created",
  "payload": {
    "id": "c67c29de-dc33-48d4-8632-d13955d24ea4",
    "patient_id": "3500a9c4-dd95-48c2-af3b-7913285b9158",
    "patient_name": "Eleanor Ward",
    "risk_level": "HIGH",
    "probability": 0.842,
    "confidence_score": 0.842,
    "created_at": "2026-09-13T16:20:00Z"
  }
}
```

---

## 2. `task_status_updated`
Dispatched during Celery task execution (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`).
