#!/usr/bin/env bash
set -euo pipefail

echo "==> Running ML Pipeline Validation & Model Contract Suite..."
cd backend
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.development}"
pytest tests/ml/ -v
echo "==> ML Pipeline Validation Passed."
