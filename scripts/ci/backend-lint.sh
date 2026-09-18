#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Backend Lint Check (flake8)..."
cd backend
flake8 .
echo "==> Backend Lint Check Passed."
