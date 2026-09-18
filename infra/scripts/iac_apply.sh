#!/usr/bin/env bash
set -euo pipefail

# HealthNova AI - IaC Apply Script (OpenTofu)
# Usage: ./iac_apply.sh <development|staging|production>

ENV="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/../environments/${ENV}"

if [[ ! -d "${TARGET_DIR}" ]]; then
  echo "Error: Environment '${ENV}' directory does not exist at ${TARGET_DIR}" >&2
  exit 1
fi

if [[ "${ENV}" == "production" ]]; then
  if [[ "${CONFIRM_PRODUCTION_APPLY:-}" != "yes" ]]; then
    echo "==========================================================================" >&2
    echo "CRITICAL SAFETY GATE: Direct production applies require explicit human approval." >&2
    echo "To execute, set CONFIRM_PRODUCTION_APPLY=yes and provide peer review sign-off." >&2
    echo "==========================================================================" >&2
    exit 2
  fi
fi

echo "==> Applying infrastructure changes for environment: ${ENV}"
cd "${TARGET_DIR}"

if command -v tofu &> /dev/null; then
  IAC_BIN="tofu"
elif command -v terraform &> /dev/null; then
  IAC_BIN="terraform"
else
  echo "Error: Neither 'tofu' nor 'terraform' found in PATH." >&2
  exit 1
fi

PLAN_FILE="tfplan-${ENV}"
if [[ -f "${PLAN_FILE}" ]]; then
  echo "==> Applying verified plan file: ${PLAN_FILE}"
  ${IAC_BIN} apply -input=false "${PLAN_FILE}"
  rm -f "${PLAN_FILE}"
else
  echo "==> No saved plan found. Running targeted apply..."
  ${IAC_BIN} apply -auto-approve -input=false
fi

echo "==> Apply completed successfully for ${ENV}."
