# Runbook 11: Credential Compromise & Secret Rotation Protocol

## 1. Symptoms
- Suspicious access logged in `AuditLog` from unrecognized IP or outside clinic hours.
- Secret or API token detected in public repository, build log, or security scanner alert.
- Pentest agent or Strix scans flag exposed bearer token.

## 2. Detection
- Security agent alert or GitHub secret scanning alert.
- Audit log query flags privilege escalation attempt.

## 3. Preconditions
- Identify the exact scope of the compromised credential (e.g. `DATABASE_URL`, `DJANGO_SECRET_KEY`, `COOLIFY_API_TOKEN`).

## 4. Authorization
- Chief Information Security Officer (CISO) and Lead SRE.

## 5. Step-by-Step Execution
1. **Isolate Affected Systems Immediately**:
   Block suspicious IP addresses at Nginx / cloud firewall:
   ```bash
   iptables -A INPUT -s <MALICIOUS_IP> -j DROP
   ```
2. **Revoke Compromised Credential**:
   - For Database: Reset PostgreSQL user password in Neon console or via CLI:
     ```bash
     neon roles reset-password <role_name> --project-id divine-smoke-01982543
     ```
   - For Coolify: Revoke API token in Coolify dashboard.
   - For JWT: Invalidate all active user refresh tokens:
     ```sql
     UPDATE token_blacklist SET is_revoked = TRUE WHERE created_at < NOW();
     ```
3. **Deploy New Cryptographic Secrets**:
   Generate cryptographically secure 50+ character tokens:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```
   Update `.env` / Coolify environment variables.
4. **Trigger Emergency Secret Rotation Audit**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/infrastructure/secrets/rotate/ \
     -H "Authorization: Bearer $IT_ADMIN_TOKEN" \
     -d '{"secret_name": "DJANGO_SECRET_KEY", "incident_id": "SEC-INC-2026-09"}'
   ```
5. **Rolling Restart of Core Services**:
   Restart all ASGI workers and web servers to adopt new credentials:
   ```bash
   docker compose restart backend celery_worker
   ```

## 6. Validation
- Staff authentication re-tested with new sessions.
- Database connectivity confirmed using new credentials.
- Old compromised credentials tested to confirm HTTP 401 / connection refused.

## 7. Rollback
- NEVER restore a revoked compromised secret under any circumstances.

## 8. Escalation Path
- Incident Commander -> CISO -> Hospital Legal & Compliance.

## 9. Post-Recovery Monitoring
- 100% audit log inspection for unauthorized actions during the exposure window.
- Issue mandatory password and MFA resets for staff accounts.
