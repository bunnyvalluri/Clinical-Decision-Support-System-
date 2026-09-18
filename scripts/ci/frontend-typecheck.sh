#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Frontend Type Check (tsc)..."
cd frontend
npx tsc --noEmit
echo "==> Frontend Type Check Passed."
