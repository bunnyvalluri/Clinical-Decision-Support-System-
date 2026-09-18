# RUNBOOK-01: Infrastructure Drift Reconciliation

## Objective
Detect and safely reconcile out-of-band cloud infrastructure modifications with authoritative OpenTofu code.

## Prerequisites
- Operator access to Platform Governance Console (`/admin/infrastructure/`).
- SSH or terminal access with OpenTofu CLI.

## Step-by-Step Procedure
1. Execute drift detection:
   ```bash
   ./infra/scripts/iac_drift_detect.sh production
   ```
2. If exit code is `2` (`DRIFT_DETECTED`), inspect output log in `/tmp/tofu_drift_production.log`.
3. If drift is legitimate hotfix:
   - Identify affected resource in `infra/modules/`.
   - Update HCL definition to match cloud reality.
   - Open Pull Request and merge.
4. If drift is unauthorized:
   - Execute controlled apply to overwrite out-of-band changes:
     ```bash
     export CONFIRM_PRODUCTION_APPLY=yes
     ./infra/scripts/iac_apply.sh production
     ```
5. Re-run `./infra/scripts/iac_drift_detect.sh production` and confirm exit code `0` (`IN_SYNC`).
