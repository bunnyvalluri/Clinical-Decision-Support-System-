#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Frontend Lint Check (ESLint)..."
cd frontend
npm run lint
echo "==> Frontend Lint Check Passed."
