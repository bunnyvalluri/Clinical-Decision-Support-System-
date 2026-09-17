#!/usr/bin/env bash
set -euo pipefail

# HealthNova AI CDSS — Coolify Rollback Script
# Requires explicit human IT Administrator confirmation before execution

COOLIFY_URL="${COOLIFY_API_URL:-http://localhost:8000/api/v1}"
TOKEN="${COOLIFY_API_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "[!] ERROR: COOLIFY_API_TOKEN is not set."
  exit 1
fi

APP_UUID="${1:-}"
TARGET_SHA="${2:-}"

if [[ -z "$APP_UUID" || -z "$TARGET_SHA" ]]; then
  echo "Usage: $0 <application_uuid> <target_commit_sha>"
  exit 1
fi

echo "============================================================"
echo "  HEALTHNOVA AI CDSS — PRODUCTION ROLLBACK INITIATION       "
echo "============================================================"
echo "Target Application: $APP_UUID"
echo "Target Commit SHA:  $TARGET_SHA"
echo "Authorized User:    $(whoami)"
echo "Timestamp:          $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo ""
read -r -p "CONFIRM ROLLBACK: Are you sure you want to revert production? (type 'CONFIRM'): " CONFIRMATION

if [[ "$CONFIRMATION" != "CONFIRM" ]]; then
  echo "[x] Rollback aborted by operator."
  exit 1
fi

echo "[*] Triggering rollback deployment..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"uuid\": \"$APP_UUID\", \"commit\": \"$TARGET_SHA\", \"force\": true}" \
  "$COOLIFY_URL/deploy")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_STATUS" =~ ^2 ]]; then
  echo "[+] Rollback queued successfully in Coolify. Status: $HTTP_STATUS"
  echo "$BODY"
else
  echo "[!] Rollback request failed with status: $HTTP_STATUS"
  echo "$BODY"
  exit 1
fi
