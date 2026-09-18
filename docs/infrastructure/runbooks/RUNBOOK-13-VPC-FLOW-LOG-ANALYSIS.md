# RUNBOOK-13: VPC Flow Log Analysis

## Objective
Analyze VPC network traffic patterns, rejected packets, and unauthorized connection attempts.

## Procedure
1. Query CloudWatch Logs Insights for VPC Flow Logs:
   ```sql
   fields @timestamp, srcAddr, dstAddr, dstPort, action, protocol
   | filter action = 'REJECT'
   | stats count(*) by srcAddr, dstPort
   | sort count(*) desc
   | limit 20
   ```
2. Identify repeated ingress rejections on port 22, 6379, 7700, 11434, or 8000.
3. If persistent port scanning from external IPs is observed, update AWS Network ACL or WAF rate-limiting rules.
