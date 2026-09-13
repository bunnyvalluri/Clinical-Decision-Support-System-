# Reports API

Endpoints for asynchronous PDF medical report generation and secure streaming downloads.

---

## 1. Endpoints

### 1.1 `POST /api/v1/reports/`
Enqueues asynchronous PDF report compilation. Returns immediately without blocking the HTTP worker.
- **Request Body:**
  ```json
  {
    "patient_id": "uuid",
    "prediction_id": "uuid",
    "report_type": "DISCHARGE_SUMMARY",
    "format": "PDF"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "task_id": "f519a64c-7df3-413d-b8dd-2e8b00b0541f",
    "report_id": "e4b176cb-a93d-4fe1-9128-552383a071f2",
    "status": "QUEUED",
    "message": "Report generation enqueued successfully."
  }
  ```

### 1.2 `GET /api/v1/reports/{id}/`
Poll report status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).

### 1.3 `GET /api/v1/reports/{id}/download/`
Streams the compiled ReportLab PDF document with `Content-Type: application/pdf`.
