#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Frontend Production Build (Next.js)..."
cd frontend
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
npm run build
echo "==> Frontend Production Build Succeeded."
