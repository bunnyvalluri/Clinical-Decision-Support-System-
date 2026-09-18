#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Backend Unit & Integration Tests..."
cd backend
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.development}"
pytest tests/test_auth.py tests/test_brand.py tests/test_health.py tests/test_external_apis_security.py tests/test_kaggle_integration.py tests/test_ai_orchestrator.py -v
echo "==> Backend Tests Passed."
