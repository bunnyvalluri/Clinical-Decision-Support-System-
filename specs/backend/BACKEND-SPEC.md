# Backend Specification: Django REST Framework & Domain Services

**Spec ID**: `BE-SPEC-001`  
**Domain**: API Layer, Service Orchestration, & Business Invariants  
**Status**: `CONVERGED`  
**Framework**: Python 3.13, Django 5.x, Django REST Framework, ASGI  

---

## 1. Architectural Layering

```
[ HTTP / WebSocket Request ]
             │
             ▼
[ URL Routing & Middleware ] (Correlation ID, Rate Limiting, CORS)
             │
             ▼
[ DRF ViewSet / APIView ] (Authentication & RBAC checks)
             │
             ▼
[ Permission Classes ] (Object-Level Authorization: HasPatientAccess)
             │
             ▼
[ DRF Serializers ] (Strict schema validation & Sanitization)
             │
             ▼
[ Domain Services ] (Pure business/clinical logic & transactional units)
             │
             ▼
[ Django ORM / Repositories ] (Neon PostgreSQL ACID transactions)
```

---

## 2. API Contract & Error Handling Conventions

1. **Envelope Format**:
   ```json
   {
     "status": "success | error",
     "data": { ... },
     "meta": {
       "correlation_id": "c7a8e52e-9d21-4f76-8e10-33b8a1c90192",
       "timestamp": "2026-09-17T13:30:00Z"
     }
   }
   ```
2. **Error Standards**:
   - HTTP 400: Serializer validation error dictionary.
   - HTTP 401: Invalid / expired credentials.
   - HTTP 403: Forbidden (Role unauthorized OR object-level relationship missing).
   - HTTP 404: Object not found.
   - HTTP 429: Rate limit exceeded (100 req/min/user).
   - HTTP 500: Sanitized internal error (Never leaks tracebacks, SQL strings, or credentials).

---

## 3. Testing & Verification
- All endpoints must possess unit tests and integration tests in `backend/apps/*/tests/`.
- Corresponding Bruno API collection files in `bruno/` must pass in CI.
