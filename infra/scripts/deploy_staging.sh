#!/usr/bin/env bash
set -euo pipefail

# HealthNova AI CDSS — Coolify Staging Deployment Trigger Script
# Invoked by CI/CD upon successful completion of Bruno API contract tests

COOLIFY_URL="${COOLIFY_API_URL:-http://localhost:8000/api/v1}"
APP_UUID="${COOLIFY_STAGING_APP_UUID:-app-staging-001}"
TOKEN="${COOLIFY_API_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "[!] ERROR: COOLIFY_API_TOKEN is not set in environment."
  exit 1
fi

echo "=== Triggering Staging Deployment via Coolify Control Plane ==="
echo "Target Application: $APP_UUID"
echo "API Endpoint:       $COOLIFY_URL/deploy"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"uuid\": \"$APP_UUID\", \"force\": false}" \
  "$COOLIFY_URL/deploy")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_STATUS" =~ ^2 ]]; then
  echo "[+] Deployment triggered successfully. Status: $HTTP_STATUS"
  echo "$BODY"
  exit 0
else
  echo "[!] Deployment trigger failed. Status: $HTTP_STATUS"
  echo "$BODY"
  exit 1
fi
