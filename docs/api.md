# API Specification Documentation

All endpoints are versioned under `/api/v1/` and return consistent JSON response envelopes.

---

## 1. Response Standards

### Success Envelope (HTTP 2xx)
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message",
  "meta": {
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 128,
      "total_pages": 7
    }
  }
}
```

### Error Envelope (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Human-readable error explanation",
    "details": {
      "field_name": ["Specific constraint failure message"]
    }
  }
}
```

---

## 2. Health & Telemetry Endpoints

### Liveness Probe
- **Endpoint**: `GET /api/v1/health/`
- **Auth**: None (Public)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-09-13T05:10:11.815Z",
    "version": "1.0.0",
    "service": "Patient Risk Level Prediction API"
  }
}
```

### Readiness Probe
- **Endpoint**: `GET /api/v1/health/ready/`
- **Auth**: None (Public)
- **Status Codes**: `200 OK` (Healthy) or `503 Service Unavailable` (Dependency failure)
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "timestamp": "2026-09-13T05:10:16.865Z",
    "dependencies": {
      "database": {
        "status": "ok",
        "engine": "PostgreSQL",
        "latency_ms": 12.4
      },
      "redis": {
        "status": "ok",
        "latency_ms": 3.8
      }
    }
  }
}
```

---

## 3. Authentication & User Endpoints (`/api/v1/auth/`)

| Method | Route | Description | Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login/` | Obtain JWT tokens & user profile | Public |
| `POST` | `/api/v1/auth/register/` | Register new clinical account | Public |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh expired access token | Public |
| `POST` | `/api/v1/auth/logout/` | Revoke & blacklist refresh token | Authenticated |
| `GET` | `/api/v1/auth/me/` | Current user profile | Authenticated |
| `PUT` | `/api/v1/auth/me/` | Update profile information | Authenticated |
| `POST` | `/api/v1/auth/change-password/` | Update password | Authenticated |
| `CRUD` | `/api/v1/auth/users/` | Administrative staff management | `ADMIN` only |

---

## 4. Audit Trail Endpoints (`/api/v1/audit/`)

| Method | Route | Description | Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/audit/` | Filter and query HIPAA audit logs | `ADMIN` only |
| `GET` | `/api/v1/audit/{id}/` | Audit log record detail | `ADMIN` only |

---

## 5. Patient Management Endpoints (`/api/v1/patients/`)

| Method | Route | Description | Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/patients/` | Register new hospital patient | Clinician, Staff, Admin |
| `GET` | `/api/v1/patients/` | Paginated patient demographic list | Authenticated (scoped by role) |
| `GET` | `/api/v1/patients/{id}/` | Retrieve full patient profile | Authorized User / Assigned Care Team |
| `PATCH` | `/api/v1/patients/{id}/` | Update patient demographic info | Authorized User / Staff / Admin |
| `DELETE` | `/api/v1/patients/{id}/` | Soft-delete patient record | `ADMIN` only |

---

## 6. Clinical Records Endpoints (`/api/v1/patients/{id}/clinical-records/`, `/api/v1/clinical-records/`)

| Method | Route | Description | Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/patients/{id}/clinical-records/` | Record new vitals & lab encounter | Clinician, Staff, Admin |
| `GET` | `/api/v1/patients/{id}/clinical-records/` | List clinical encounter history for patient | Assigned Care Team / Patient (own) |
| `GET` | `/api/v1/clinical-records/{id}/` | Retrieve specific clinical encounter | Assigned Care Team / Patient (own) |
| `PATCH` | `/api/v1/clinical-records/{id}/` | Update clinical encounter observations | Clinician, Staff, Admin |

---

## 7. Machine Learning Model Registry Endpoints (`/api/v1/models/`)

| Method | Route | Description | Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/models/` | List all registered model versions, statuses, and benchmark metrics | Authenticated |
| `GET` | `/api/v1/models/{id}/` | Retrieve detailed model metadata, training dataset, and evaluation metrics | Authenticated |
| `POST` | `/api/v1/models/{id}/activate/` | Promote candidate or archived model to ACTIVE (retires prior active version) | `ADMIN` or Clinician |
| `POST` | `/api/v1/models/{id}/rollback/` | Safely rollback production serving to a prior verified model version | `ADMIN` or Clinician |

---

## 8. Patient Risk Level Prediction Endpoints (`/api/v1/predictions/`)

| Method | Route | Description | Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/predictions/` | Execute real-time risk assessment for a patient from EHR vitals | Clinician, `ADMIN` |
| `GET` | `/api/v1/predictions/` | Filter and paginate historical AI inferences (`patient_id`, `risk_level`) | Care Team / Patient (own) |
| `GET` | `/api/v1/predictions/{id}/` | Retrieve full prediction detail including explainability and risk drivers | Care Team / Patient (own) |
| `POST` | `/api/v1/predictions/batch/` | High-throughput vectorized risk assessment for up to 500 patient encounters | Clinician, `ADMIN` |
| `POST` | `/api/v1/predictions/{id}/override/` | Record physician clinical override of AI risk prediction with justification | Clinician, `ADMIN` |

