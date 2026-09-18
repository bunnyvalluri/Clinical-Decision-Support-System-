# RUNBOOK-08: Cost Anomaly Investigation & Budget Controls

## Objective
Respond to AWS billing spikes, unattached EBS volumes, or compute cost anomalies.

## Procedure
1. Navigate to `/admin/infrastructure/` -> **FinOps Cost Governance**.
2. If billing API reports an anomaly, inspect AWS Cost Explorer:
   ```bash
   aws ce get-cost-and-usage --time-period Start=2026-09-01,End=2026-09-18 \
     --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
   ```
3. Check for unattached EBS volumes:
   ```bash
   aws ec2 describe-volumes --filters "Name=status,Values=available"
   ```
4. Review S3 lifecycle rules: confirm non-current backup versions transition to Glacier / IA.
5. Scale down non-production dev/staging instances outside business hours if needed.
