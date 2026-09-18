# CI/CD Troubleshooting & Diagnostics Guide

## Common Pipeline Diagnostic Scenarios

### 1. Database Connection Timeout in CI
- **Symptom**: `django.db.utils.OperationalError: could not connect to server: Connection refused`.
- **Cause**: PostgreSQL service container takes 2-3 seconds to initialize while Django checks immediately.
- **Resolution**: Both `.gitlab/ci/backend.yml` and `.github/workflows/ci.yml` include an explicit TCP socket polling wait loop that verifies port 5432 is open before attempting `python manage.py check` or `migrate`.

### 2. Flaky ML Test Failures
- **Symptom**: `AssertionError` on model metrics or probability splits.
- **Cause**: Unseeded random state during train/test splitting or bootstrapping.
- **Resolution**: `backend/tests/conftest.py` has an autouse fixture setting `random.seed(42)` and `np.random.seed(42)`.

### 3. Kaggle API Rate Limits / Network Latency
- **Symptom**: Kaggle dataset search or download fails with timeout.
- **Cause**: CI jobs attempting to contact live Kaggle API over external WAN.
- **Resolution**: Fast CI operates purely offline with curated benchmark catalogs (`REAL_KAGGLE_OFFLINE_BENCHMARKS`). Live downloads are restricted to scheduled pipelines (`CI_PIPELINE_SOURCE == "schedule"`).

### 4. Docker Build Failure on Root Context
- **Symptom**: `COPY backend/requirements.txt not found`.
- **Cause**: Building from nested directory instead of workspace root.
- **Resolution**: Multi-stage `Dockerfile` is anchored to workspace root (`c:\4-1`), copying `backend/requirements.txt` and `backend/` cleanly.
