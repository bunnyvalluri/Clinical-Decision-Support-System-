# RUNBOOK-11: Firewall Egress Lockdown

## Objective
Restrict outbound traffic from private data and compute subnets to prevent unauthorized data exfiltration.

## Procedure
1. Verify Data Tier Security Group (`data-sg`):
   - Outbound egress to the public internet (`0.0.0.0/0`) must be blocked.
   - Only local VPC CIDR communication is allowed.
2. Verify App Tier Security Group (`app-sg`):
   - Outbound egress is permitted to Neon PostgreSQL endpoint and approved external APIs via NAT Gateway.
3. If an egress anomaly is suspected:
   - Check VPC Flow Logs for non-standard outbound destination IPs on ports 443/80.
