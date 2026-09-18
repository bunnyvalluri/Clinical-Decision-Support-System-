# RUNBOOK-10: IMDSv2 & SSRF Defense Audit

## Objective
Verify that all EC2 instances strictly enforce IMDSv2 to prevent SSRF exfiltration of IAM instance credentials.

## Procedure
1. Navigate to `/admin/infrastructure/` -> **HIPAA & Policy Guardrails**.
2. Verify `POL-COM-001: Host IMDSv2 & EBS Disk Encryption` is `PASSED`.
3. Audit running EC2 instances via AWS CLI:
   ```bash
   aws ec2 describe-instances --query \
     "Reservations[*].Instances[*].[InstanceId,MetadataOptions.HttpTokens,MetadataOptions.HttpPutResponseHopLimit]" \
     --output table
   ```
4. Confirm:
   - `HttpTokens` = `required`
   - `HttpPutResponseHopLimit` = `1`
5. If any instance reports `optional`, immediately modify metadata options:
   ```bash
   aws ec2 modify-instance-metadata-options --instance-id <INSTANCE-ID> \
     --http-tokens required --http-put-response-hop-limit 1 --http-endpoint enabled
   ```
