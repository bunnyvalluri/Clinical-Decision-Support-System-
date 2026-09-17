# Coolify Security Incident Response Runbook — HealthNova AI CDSS

> **Classification**: Incident Response Protocol  
> **Target Scenarios**: Leaked Coolify API token, unauthorized deployment trigger, compromised host

---

## 1. Immediate Containment Steps

If a Coolify API token or deployment webhook secret is suspected of being compromised:

1. **Emergency Token Revocation**:
   - Access the Coolify host shell or local console directly.
   - Revoke the token via database or Coolify UI immediately:
     ```bash
     docker exec -it coolify-db psql -U coolify -d coolify -c "DELETE FROM personal_access_tokens WHERE name='healthnova-django-integration';"
     ```
2. **Inspect Active Deployments**:
   - Verify no unauthorized containers were provisioned:
     ```bash
     docker ps --format "table {{.ID}}\t{{.Image}}\t{{.CreatedAt}}\t{{.Status}}"
     ```
3. **Audit Deployment History**:
   - Query recent deployment logs for unfamiliar commit SHAs or external IP triggers:
     ```bash
     curl -H "Authorization: Bearer <NEW_TOKEN>" http://localhost:8000/api/v1/deployments
     ```
4. **Issue New Token & Update Django**:
   - Generate a replacement scoped token with expiration.
   - Update `COOLIFY_API_TOKEN` in `backend/.env` and restart Daphne ASGI gateway.
5. **Post-Incident Review**:
   - Log the incident in `AuditLog` and file a security incident report with the DevSecOps team.
