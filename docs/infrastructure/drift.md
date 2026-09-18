# Infrastructure Drift Detection & Remediation

## Drift Detection Principle
Infrastructure drift occurs when manual edits are made to cloud resources outside the Git-managed OpenTofu definitions.

## Drift Checking Process
1. **Automated Scheduled Scan**: Daily cron job executes `iac_drift_detect.sh`.
2. **On-Demand Console Evaluation**: Triggered via Platform Governance UI at `/admin/infrastructure/`.
3. **Exit Code Evaluation**:
   - `0`: IN_SYNC (Authoritative code matches running cloud infrastructure).
   - `2`: DRIFT_DETECTED (Out-of-band cloud modifications observed).
   - `1`: ERROR (API or execution failure).

## Remediation Workflow
When drift is detected:
1. Review generated plan output diffs.
2. Determine if the out-of-band change was authorized for an emergency hotfix.
3. If valid, backport configuration to `infra/modules/` or `infra/environments/`.
4. If unauthorized or insecure, execute `tofu apply` to enforce authoritative code state.
