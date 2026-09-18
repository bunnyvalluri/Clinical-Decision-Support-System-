# RUNBOOK-12: Coolify Docker Host Recovery

## Objective
Recover or replace an unhealthy Coolify application host instance without clinical data loss.

## Procedure
1. Verify Neon PostgreSQL connection is healthy (authoritative clinical data is safe).
2. If host VM is unresponsive, attempt EC2 reboot:
   ```bash
   aws ec2 reboot-instances --instance-ids <INSTANCE-ID>
   ```
3. If host VM storage is corrupted:
   - Terminate instance and reprovision via OpenTofu:
     ```bash
     tofu apply -target=module.server.aws_instance.host
     ```
   - Connect via AWS Systems Manager Session Manager.
   - Run host hardening script `./infra/scripts/harden_server.sh`.
   - Restore Coolify configuration and re-deploy application stacks.
