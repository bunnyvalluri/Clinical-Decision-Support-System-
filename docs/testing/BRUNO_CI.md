# Bruno CI/CD Integration & Quality Gates — HealthNova AI CDSS

## 1. CI Pipeline Workflow

In automated GitHub Actions and local verification stages, Bruno executes after backend unit tests pass:

```
1. Lint & Format (ruff, flake8, prettier)
   ↓
2. Typecheck (tsc --noEmit, mypy)
   ↓
3. Backend Unit & Django Tests (pytest --ds=config.settings.test)
   ↓
4. Frontend Component Tests (npm test)
   ↓
5. Start Test Services (PostgreSQL, Redis, Celery Mock, Meilisearch)
   ↓
6. Execute Bruno Smoke Suite (`bru run health --env Test`)
   ↓
7. Execute Bruno Contract Suite (`bru run --env Test`)
   ↓
8. Execute Bruno 5-Role RBAC & IDOR Suite (`bru run security --env Test`)
   ↓
9. Generate & Redact JUnit Reports (`reports/bruno/junit.xml`)
   ↓
10. Quality Gate Assertion (Zero Regressions Allowed)
```

---

## 2. Automated Test Runner Script

The custom runner script [`scripts/run_bruno_tests.py`](file:///C:/4-1/scripts/run_bruno_tests.py) provides headless execution:

```bash
# Execute against Test environment
python scripts/run_bruno_tests.py --env Test

# Execute specific collection category
python scripts/run_bruno_tests.py --env Test --category security/RBAC

# Output format
# Generates reports/bruno/junit.xml and reports/bruno/summary.json
```

---

## 3. Redaction and Failure Artifacts

When an assertion fails in CI:
- The runner captures the request URL, method, status code, and assertion error.
- All headers matching `Authorization`, `Cookie`, `Set-Cookie`, `X-Master-Key`, and JWT patterns are redacted with `[REDACTED]`.
- All response body values matching email, phone, or token patterns are scrubbed.
- The pipeline aborts with exit code `1` if any non-optional assertion fails (`|| true` is strictly prohibited).
