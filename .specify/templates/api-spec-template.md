# API Endpoint Specification: [ENDPOINT NAME]

**API Spec ID**: `API-[DOMAIN]-[SEQ]`  
**HTTP Method & Path**: `[GET | POST | PUT | PATCH | DELETE] /api/v1/...`  
**Target ViewSet**: `backend/apps/[app]/views.py`  
**Authentication**: `Bearer JWT / Session Authentication`  
**Required Roles**: `[Doctor | Nurse | Informaticist | Admin | Patient]`  
**Object-Level Authorization**: `HasPatientAccess / IsPatientOwner`  

---

## 1. Request Contract
- **Headers**:
  - `Authorization: Bearer <token>` (Required)
  - `X-Correlation-ID: <uuid>` (Auto-propagated)
  - `Content-Type: application/json`
- **Path Parameters**:
  - `patient_id` (UUID, Required)
- **Query Parameters**:
  - `page` (int, default: 1)
  - `page_size` (int, default: 20, max: 100)
- **Request Body (JSON Schema)**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["model_id", "clinical_context"],
  "properties": {
    "model_id": { "type": "string" },
    "clinical_context": { "type": "object" }
  }
}
```

---

## 2. Response Contract
- **HTTP 200 / 201 Success**:
```json
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "correlation_id": "uuid",
    "timestamp": "ISO-8601"
  }
}
```
- **HTTP 400 Bad Request**: Validation error dictionary per field.
- **HTTP 401 Unauthorized**: Missing or expired credentials.
- **HTTP 403 Forbidden**: Role unauthorized OR object-level authorization failure.
- **HTTP 404 Not Found**: Patient or resource does not exist.
- **HTTP 429 Too Many Requests**: Rate limit exceeded (Rate limit policy: 100 req/min).
- **HTTP 500 Internal Error**: Generic error response (never leaks stack traces or SQL details).

---

## 3. Bruno API Collection Test Contract
- Test file: `bruno/[domain]/[endpoint_name].bru`
- Must assert: status 200 with valid token, status 401 without token, status 403 when accessing unauthorized patient.
