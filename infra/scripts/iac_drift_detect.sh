#!/usr/bin/env bash
set -euo pipefail

# HealthNova AI - IaC Drift Detection Script (OpenTofu)
# Usage: ./iac_drift_detect.sh <development|staging|production>

ENV="${1:-production}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/../environments/${ENV}"

if [[ ! -d "${TARGET_DIR}" ]]; then
  echo "Error: Environment '${ENV}' directory does not exist at ${TARGET_DIR}" >&2
  exit 1
fi

echo "==> Checking for infrastructure drift in: ${ENV}"
cd "${TARGET_DIR}"

if command -v tofu &> /dev/null; then
  IAC_BIN="tofu"
elif command -v terraform &> /dev/null; then
  IAC_BIN="terraform"
else
  echo "Error: Neither 'tofu' nor 'terraform' found in PATH." >&2
  exit 1
fi

${IAC_BIN} init -input=false > /dev/null 2>&1

set +e
${IAC_BIN} plan -detailed-exitcode -no-color > /tmp/tofu_drift_${ENV}.log 2>&1
EXIT_CODE=$?
set -e

if [[ ${EXIT_CODE} -eq 0 ]]; then
  echo "STATUS: IN_SYNC"
  echo "Infrastructure matches authoritative code. Zero drift detected."
  exit 0
elif [[ ${EXIT_CODE} -eq 2 ]]; then
  echo "STATUS: DRIFT_DETECTED"
  echo "Infrastructure changes detected outside code repository:"
  cat /tmp/tofu_drift_${ENV}.log
  exit 2
else
  echo "STATUS: ERROR"
  echo "Error executing plan check:"
  cat /tmp/tofu_drift_${ENV}.log
  exit 1
fi
