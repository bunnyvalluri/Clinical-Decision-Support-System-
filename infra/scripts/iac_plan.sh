#!/usr/bin/env bash
set -euo pipefail

# HealthNova AI - IaC Plan Script (OpenTofu)
# Usage: ./iac_plan.sh <development|staging|production>

ENV="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/../environments/${ENV}"

if [[ ! -d "${TARGET_DIR}" ]]; then
  echo "Error: Environment '${ENV}' directory does not exist at ${TARGET_DIR}" >&2
  exit 1
fi

echo "==> Planning infrastructure for environment: ${ENV}"
cd "${TARGET_DIR}"

if command -v tofu &> /dev/null; then
  IAC_BIN="tofu"
elif command -v terraform &> /dev/null; then
  IAC_BIN="terraform"
else
  echo "Error: Neither 'tofu' nor 'terraform' found in PATH." >&2
  exit 1
fi

echo "==> Initializing ${IAC_BIN}..."
${IAC_BIN} init -input=false

echo "==> Validating configuration..."
${IAC_BIN} validate

echo "==> Running speculative execution plan..."
${IAC_BIN} plan -input=false -out="tfplan-${ENV}"

echo "==> Plan complete. Output saved to: ${TARGET_DIR}/tfplan-${ENV}"
