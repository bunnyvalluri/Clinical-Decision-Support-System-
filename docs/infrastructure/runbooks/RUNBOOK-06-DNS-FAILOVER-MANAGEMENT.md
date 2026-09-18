# RUNBOOK-06: DNS Failover Management

## Objective
Redirect platform traffic during multi-region disaster recovery or major maintenance windows.

## Procedure
1. Identify target secondary load balancer endpoint or standby static status page.
2. In `infra/modules/dns/variables.tf`, prepare secondary `alb_dns_name`.
3. If managing through Route53:
   ```bash
   aws route53 change-resource-record-sets --hosted-zone-id <ZONE-ID> --change-batch file://failover.json
   ```
4. Verify DNS propagation:
   ```bash
   dig +short app.healthnova.ai @8.8.8.8
   ```
5. Confirm HTTPS certificate validity on target endpoint before cutting over traffic.
