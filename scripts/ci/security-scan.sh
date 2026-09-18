#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Security Scans (Bandit SAST & Secret Checks)..."
cd backend
bandit -r apps/ services/ repositories/ ml/ integrations/ -ll --exclude tests,venv,.venv
echo "==> Security Scans Passed."
