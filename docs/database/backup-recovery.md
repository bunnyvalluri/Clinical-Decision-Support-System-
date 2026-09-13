# Database Backup & Disaster Recovery (Neon PITR)

Neon Serverless PostgreSQL incorporates automated continuous Write-Ahead Log (WAL) archiving and Point-In-Time Recovery (PITR).

---

## 1. Service Level Objectives

- **Recovery Point Objective (RPO):** < 5 minutes.
- **Recovery Time Objective (RTO):** < 15 minutes.

---

## 2. Recovery Procedures

### Point-In-Time Recovery (PITR)
Neon retains WAL logs up to the configured retention window (e.g., 7 days in production). If data corruption occurs:
1. Identify the target UTC timestamp immediately preceding the incident: `2026-09-13T14:32:00Z`.
2. Create a new branch via Neon Console or Neon CLI:
   ```bash
   neon branches create --from-timestamp "2026-09-13T14:32:00Z" --name recovery-branch
   ```
3. Update `DATABASE_URL` in the application cluster to point to the restored branch endpoint.
4. Restart application containers to resume traffic.
