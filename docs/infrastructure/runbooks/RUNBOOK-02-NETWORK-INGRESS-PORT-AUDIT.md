# RUNBOOK-02: Network Ingress Port Audit

## Objective
Audit and enforce that zero sensitive backend or database ports are exposed to `0.0.0.0/0`.

## Procedure
1. Navigate to `/admin/infrastructure/` -> **Topology & Cloud Hardening**.
2. Verify policy check `POL-NET-001: Strict Ingress Port Isolation` displays `PASSED`.
3. Verify AWS Security Group rules:
   ```bash
   aws ec2 describe-security-groups --filters "Name=tag:Project,Values=HealthNova-AI" \
     --query "SecurityGroups[*].IpPermissions[*].[FromPort,ToPort,IpRanges[*].CidrIp]" --output json
   ```
4. Confirm only ports 80 and 443 contain CIDR `0.0.0.0/0`.
5. If port 22, 6379, 7700, 8000, or 11434 is exposed to `0.0.0.0/0`, immediately revoke the rule.
