# Neon Lakebase PostgreSQL — Backup, Restore & Disaster Recovery Guide

## Overview
The Clinical Decision Support System (CDSS) uses **Neon Serverless PostgreSQL** as its managed production database. Neon separates compute and storage into decoupled layers, utilizing copy-on-write page servers and continuous write-ahead log (WAL) storage on Amazon S3.

This architecture enables:
1. **Continuous Point-In-Time Recovery (PITR)** to any second within the retention window.
2. **Instant zero-copy branching** for non-destructive schema migrations and emergency data isolation.
3. **Automated high availability** without managing primary-replica failovers.

---

## 1. Backup Architecture & Retention

### Continuous WAL Archiving
- Every transaction committed to PostgreSQL is immediately streamed to Neon Safekeepers and durable page servers.
- **RPO (Recovery Point Objective)**: **< 1 second** (zero data loss on compute restart).
- **RTO (Recovery Time Objective)**: **< 30 seconds** (instant compute provisioning).
- **Retention Period**:
  - Production (`main` branch): **7 to 30 days continuous PITR history** depending on plan tier.
  - Staging / Feature branches: 24 to 72 hours.

---

## 2. Emergency Point-In-Time Recovery (PITR) Runbook

If data corruption or accidental table modification occurs, follow this exact restoration runbook:

### Step 1: Identify Incident Timestamp
Determine the exact UTC timestamp immediately prior to the corrupting event:
```bash
# Example incident time: 2026-09-13T16:15:00Z
TARGET_TIME="2026-09-13T16:14:59Z"
```

### Step 2: Create Point-In-Time Restoration Branch
Do **not** drop or overwrite the current production branch immediately. Instead, branch from the target timestamp:
```bash
# Using Neon CLI
neon branches create \
  --project-id $NEON_PROJECT_ID \
  --name recovery-pitr-$(date +%s) \
  --parent main \
  --timestamp $TARGET_TIME
```

Alternatively, use the Neon Management Console:
1. Navigate to **Branches** -> **New Branch**.
2. Set Branch Name: `recovery-point-in-time`.
3. Select Parent Branch: `main`.
4. Choose **Point in Time** and select the timestamp before the incident occurred.
5. Click **Create Branch**.

### Step 3: Validate Clinical Data Integrity
Connect to the restoration branch database URL and run validation queries:
```sql
-- Check patient census count
SELECT count(*) FROM patients_patient;

-- Verify latest intact clinical record
SELECT max(created_at) FROM clinical_clinicalrecord;

-- Verify ML prediction audit trail
SELECT count(*) FROM predictions_prediction;
```

### Step 4: Promote Restoration Branch to Production
Once data integrity is confirmed:
1. Promote the recovery branch to default:
   ```bash
   neon branches set-default recovery-pitr-xxx --project-id $NEON_PROJECT_ID
   ```
2. Update the `DATABASE_URL` environment variable in the application orchestration layer (e.g. Docker, ECS, or Kubernetes) to point to the new endpoint.
3. Restart Daphne ASGI and Celery workers to clear open connection pools:
   ```bash
   docker-compose restart backend celery_worker
   ```

---

## 3. Pre-Deployment Safety Snapshot

Before running heavy Django schema migrations:
```bash
# Create an instant safety branch before migrating
neon branches create \
  --project-id $NEON_PROJECT_ID \
  --name pre-migration-safety \
  --parent main
```
If `python manage.py migrate` fails or causes data locking, immediately switch the connection string back to `pre-migration-safety` with zero downtime.

---

## 4. Off-Site Cold Storage Exports (HIPAA Compliance)

For long-term statutory compliance (HIPAA 7-year patient audit trail mandate), run periodic logical pg_dump backups to an encrypted S3 bucket:

```bash
# Daily automated encrypted dump
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --compress=9 \
  --file="cdss_backup_$(date +%Y%m%d_%H%M%S).dump"

# Upload to HIPAA-compliant encrypted storage
aws s3 cp "cdss_backup_*.dump" s3://hospital-cdss-backups/postgres/ \
  --sse aws:kms \
  --sse-kms-key-id arn:aws:kms:region:account:key/xxx
```
