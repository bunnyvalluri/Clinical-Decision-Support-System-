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
