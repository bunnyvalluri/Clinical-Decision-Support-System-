# RUNBOOK-09: Production Apply Sign-Off Protocol

## Objective
Enforce the mandatory human approval gate for all OpenTofu changes targeting the production cloud tier.

## Gate Checklist
Before applying changes to production:
1. Speculative plan generated and verified:
   - Resource additions reviewed (`+N to add`).
   - Resource modifications checked for in-place updates vs destruction (`~N to change`).
   - Any resource destruction (`-N to destroy`) requires explicit Clinical Safety Lead and SRE sign-off.
2. Sign-off token generated and peer-reviewed.
3. Apply execution:
   ```bash
   export CONFIRM_PRODUCTION_APPLY=yes
   ./infra/scripts/iac_apply.sh production
   ```
   Or authorize through the Platform Governance Console using the approved sign-off token.
4. Verify Django `/api/v1/infrastructure/health/` and agent telemetry post-apply.
