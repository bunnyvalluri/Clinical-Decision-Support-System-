# RUNBOOK-14: Disaster Recovery OpenTofu Rebuild

## Objective
Rebuild the complete platform infrastructure in a secondary AWS region within RTO targets (< 30 minutes).

## Procedure
1. Declare secondary region target:
   ```bash
   cd infra/environments/production
   export AWS_DEFAULT_REGION="us-east-2"
   ```
2. Re-initialize OpenTofu backend:
   ```bash
   tofu init -reconfigure
   ```
3. Run comprehensive speculative plan:
   ```bash
   tofu plan -out=dr-recovery-plan
   ```
4. Obtain Incident Commander sign-off:
   ```bash
   export CONFIRM_PRODUCTION_APPLY=yes
   tofu apply dr-recovery-plan
   ```
5. Confirm VPC, Subnets, Security Groups, Host VM, and S3 Buckets are provisioned.
6. Verify Neon PostgreSQL secondary endpoint or PITR restore.
7. Execute automated smoke tests (`pytest backend/tests/test_prompt62_infrastructure_governance.py`).
