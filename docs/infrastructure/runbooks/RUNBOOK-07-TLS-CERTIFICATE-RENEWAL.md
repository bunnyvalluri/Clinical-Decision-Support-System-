# RUNBOOK-07: TLS Certificate Renewal & CAA Validation

## Objective
Verify automated TLS certificate renewals (Let's Encrypt / AWS Certificate Manager) and CAA records.

## Procedure
1. Verify CAA records allow required certificate authorities:
   ```bash
   dig +short CAA healthnova.ai
   # Expect: amazon.com and letsencrypt.org
   ```
2. Check certificate expiration:
   ```bash
   echo | openssl s_client -servername app.healthnova.ai -connect app.healthnova.ai:443 2>/dev/null | openssl x509 -noout -dates
   ```
3. If using Traefik in Coolify:
   - Check Traefik logs for ACME challenge status:
     ```bash
     docker logs coolify-proxy | grep -i acme
     ```
4. If manual renewal is required:
   - Trigger ACM certificate renewal or re-issue certificate request via AWS console/CLI.
