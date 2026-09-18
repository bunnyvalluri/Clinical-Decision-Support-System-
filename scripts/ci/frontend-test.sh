#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Frontend Unit & Route Tests..."
cd frontend
npm test
echo "==> Frontend Tests Passed."
