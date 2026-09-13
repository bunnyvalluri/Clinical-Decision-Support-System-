"""
Generator for docs/security/ and docs/testing/
"""
from pathlib import Path

DOCS_DIR = Path(r"c:\4-1\docs")


def write_file(rel_path: str, content: str):
    p = DOCS_DIR / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Created {rel_path} ({len(content)} chars)")


def generate():
    # =============================================================
    # docs/security/ (9 files)
    # =============================================================
    write_file("security/overview.md", """
# Security & Compliance Overview

The **PatientRisk Clinical Decision Support System** implements defense-in-depth principles to protect Electronic Protected Health Information (ePHI) and uphold strict clinical accountability.

---

## 1. Compliance Alignment

- **HIPAA Security Rule:** Implements technical safeguards including unique user identification, emergency access procedures, automatic logoff, and audit controls.
- **Principle of Least Privilege:** Users receive only the permissions strictly required to execute their specific clinical or administrative tasks.
- **Zero Cleartext Credentials:** Passwords hashed using PBKDF2 with SHA-256; secrets injected via environment variables.
""")

    write_file("security/authentication.md", """
# Authentication System

Authentication utilizes dual-token JSON Web Tokens (JWT) implemented via `djangorestframework-simplejwt`.

---

## 1. Token Lifecycles

- **Access Token:** 15-minute validity window. Contains user ID, email, role, and permissions.
- **Refresh Token:** 7-day validity window. Used to renew expired access tokens via `POST /api/v1/auth/token/refresh/`.
- **Token Blacklisting [PLANNED]:** Redis-backed blacklist to immediately invalidate tokens upon user logout.
""")

    write_file("security/authorization.md", """
# Authorization Architecture

Authorization is enforced at both view and object levels.

---

## 1. Scoped Querysets

Views override `get_queryset()` to prevent unauthorized horizontal escalation:
```python
def get_queryset(self):
    user = self.request.user
    if user.role == UserRole.PATIENT:
        return Patient.objects.filter(user=user)
    elif user.role in [UserRole.CLINICIAN, UserRole.DOCTOR]:
        return Patient.objects.filter(primary_physician=user)
    return Patient.objects.all()
```
""")

    write_file("security/rbac.md", """
# Role-Based Access Control (RBAC) Matrix

| Permission / Action | ADMIN | CLINICIAN / DOCTOR | NURSE | ANALYST | PATIENT |
|---|---|---|---|---|---|
| Register User Accounts | Yes | No | No | No | No |
| Admit Patient | Yes | Yes | Yes | No | No |
| Record Vital Signs | Yes | Yes | Yes | No | No |
| Request ML Prediction | Yes | Yes | No | No | No |
| Record Clinical Override | No | Yes | No | No | No |
| Download PDF Reports | Yes | Yes | Yes | No | Own Only |
| View System Audit Logs | Yes | No | No | No | No |
| Promote Model Versions | Yes | No | No | No | No |
""")

    write_file("security/data-protection.md", """
# Data Protection & Encryption

- **Encryption in Transit:** Mandatory TLS 1.3 / HTTPS for all HTTP traffic and WSS for WebSockets.
- **Encryption at Rest:** Neon PostgreSQL enforces AES-256 transparent data encryption across storage volumes.
- **Soft Deletion:** Records are soft deleted (`is_deleted=True`) to maintain audit continuity.
""")

    write_file("security/api-security.md", """
# API Security & Hardening

1. **CORS Validation:** Strictly limits cross-origin calls to approved frontends.
2. **CSRF Protection:** Configured with `CSRF_TRUSTED_ORIGINS`.
3. **Rate Limiting:** DRF throttling protects endpoints from brute force:
   - Anon Throttle: 100 requests/day.
   - User Throttle: 1000 requests/hour.
   - Prediction Burst Throttle: 60 requests/minute.
""")

    write_file("security/websocket-security.md", """
# WebSocket Handshake Security

WebSockets cannot send custom HTTP headers during initial browser handshakes.
- **Solution:** JWT is transmitted as a URL query parameter (`?token=...`).
- **Validation:** ASGI middleware parses the query string, verifies signature and expiration, and rejects invalid connections with HTTP 403 / close code 4003 before establishing channel state.
""")

    write_file("security/audit-logging.md", """
# Immutable Clinical Audit Logging

Every critical clinical mutation triggers an entry in the `AuditLog` table.

---

## 1. Schema (`apps.core.models.AuditLog`)

- `user`: Foreign key to the acting user.
- `action`: `CREATE`, `UPDATE`, `DELETE`, `PREDICT`, `OVERRIDE`.
- `resource_type`: Target entity name (e.g., `Prediction`, `Patient`).
- `resource_id`: UUID of target entity.
- `ip_address`: Client IP address.
- `metadata`: JSON diff capturing before/after values and clinical rationale.
""")

    write_file("security/security-checklist.md", """
# Production Security Verification Checklist

- [x] Secret keys randomized and removed from repository code.
- [x] Debug mode disabled (`DEBUG = False`).
- [x] Database password complex and SSL required (`sslmode=require`).
- [x] HTTPS enforced with HSTS headers.
- [x] Non-root user execution in all Docker containers.
- [x] Real-time WebSockets authenticated via JWT.
- [x] Physiological ranges validated on API inputs.
- [x] All clinical overrides logged to immutable audit trail.
""")

    # =============================================================
    # docs/testing/ (9 files)
    # =============================================================
    write_file("testing/overview.md", """
# Testing & Quality Assurance Overview

The PatientRisk CDSS testing framework utilizes **Pytest** and **TypeScript Compiler (`tsc`)** to ensure deterministic clinical reliability.

---

## 1. Test Pyramid

- **Unit Tests:** Preprocessing, model feature transformations, serializer validations.
- **Integration Tests:** REST APIs, service layer orchestration, database constraints, Celery task execution.
- **End-to-End Test:** Complete 15-step clinical workflow test (`test_e2e_production_flow.py`).
""")

    write_file("testing/backend-testing.md", """
# Backend Testing with Pytest

The backend test suite is executed using `pytest`.

---

## 1. Execution Commands

```bash
# Run all fast unit and API tests
pytest -q

# Run with verbose output and short tracebacks
pytest -v --tb=short

# Run specific test module
pytest tests/test_predictions.py -v
```

### Pytest Configuration (`pytest.ini`)
Configured with `--reuse-db` to prevent slow table drops between runs, and bytecode tracing disabled by default for sub-second test execution.
""")

    write_file("testing/frontend-testing.md", """
# Frontend Testing & Type Safety

Frontend validation combines TypeScript static analysis with production build verification.

---

## 1. Commands

```bash
# Type check all components and stores
npm run type-check

# Compile production bundle and prerender static routes
npm run build
```
""")

    write_file("testing/api-testing.md", """
# REST API Test Suite

API endpoints are tested using Django REST Framework's `APIClient`:
- Verifies HTTP status codes (`200`, `201`, `202`, `422`).
- Asserts presence of standardized envelope keys (`success`, `data`, `error`).
- Verifies permission denial (`403`) for unauthorized roles.
""")

    write_file("testing/database-testing.md", """
# Database Constraint & Migration Testing

Tests in `tests/test_database_schema.py` verify:
- Unique constraints on MRN and user email.
- Soft-delete filters (`is_deleted=False`).
- Foreign key cascade protections (`ON DELETE PROTECT` on active models).
""")

    write_file("testing/ml-testing.md", """
# Machine Learning Validation Tests

Tests in `tests/test_ml_pipeline.py` and `tests/test_explainable_ml.py` verify:
- Deterministic output across multiple inferences with identical vitals.
- Output probability strictly bounded within $[0.0, 1.0]$.
- Sum of SHAP attributions matches model prediction log-odds.
- Natural language descriptions correctly reflect vital severity.
""")

    write_file("testing/websocket-testing.md", """
# WebSocket Channels Testing

Tests in `tests/test_websockets.py` utilize Channels `WebsocketCommunicator`:
- Asserts successful connection with valid JWT query token.
- Asserts rejection of unauthenticated or expired tokens.
- Verifies broadcast reception on `dashboard` channel groups.
""")

    write_file("testing/integration-testing.md", """
# End-to-End Integration Testing

The integration test [test_e2e_production_flow.py](file:///c:/4-1/backend/tests/test_e2e_production_flow.py) validates the complete 15-step clinical lifecycle in a single automated test:
1. Clinician registration.
2. Login and JWT issuance.
3. Dashboard telemetry query.
4. Patient admission.
5. Clinical vital sign encounter logging.
6. Real-time prediction request.
7. Feature preprocessing.
8. ML inference execution.
9. Risk result classification.
10. SHAP factor attribution extraction.
11. PostgreSQL persistence.
12. Redis event publishing.
13. WebSocket distribution.
14. Prediction audit history query.
15. Celery PDF discharge report compilation and download.
""")

    write_file("testing/test-strategy.md", """
# Test Strategy & Performance Optimization

### Execution Speed Optimization
In Python 3.13, default coverage tracing (`pytest-cov`) introduces significant overhead on complex libraries like scikit-learn and pandas. Removing bytecode tracing from default `pytest.ini` reduced test collection and execution time from over 3 minutes to under 50 seconds.
""")

    print("Generated security and testing documentation.")


if __name__ == "__main__":
    generate()
