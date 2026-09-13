# Error Handling & Exceptions

The system utilizes a centralized custom exception handler (`apps.core.exceptions.custom_exception_handler`) to ensure consistent, predictable error responses.

---

## 1. Standard Error Envelope

When an error occurs, the API returns a structured JSON payload:
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Invalid clinical vital measurements.",
    "details": {
      "systolic_bp": ["Systolic blood pressure must be <= 300 mmHg."]
    }
  }
}
```

---

## 2. HTTP Status Code Mapping

- `400 Bad Request`: Malformed JSON or syntax errors.
- `401 Unauthorized`: Missing, expired, or invalid JWT.
- `403 Forbidden`: User lacks necessary clinical role or permissions.
- `404 Not Found`: Target patient, record, or model version does not exist.
- `422 Unprocessable Entity`: Semantic validation failure (e.g., impossible vitals).
- `500 Internal Server Error`: Unhandled system exception (logged with stack trace).
