# HealthNova AI CDSS — Backup Strategy & Retention Policy

## 1. Authoritative Database Backup (Neon Lakebase PostgreSQL)

HealthNova AI relies on Neon Serverless PostgreSQL (`divine-smoke-01982543`, branch `production`). Neon decouples compute from storage, utilizing copy-on-write page servers and continuous write-ahead log (WAL) archiving to AWS S3.

### 1.1 Continuous WAL Archiving (Hot Tier)
- **Mechanism**: Every committed transaction is immediately replicated across Neon Safekeepers and written to durable page servers.
- **RPO (Recovery Point Objective)**: Sub-second (< 1s) under normal operation.
- **Retention Window**: 21,600 seconds (6 hours) continuous history on active plan tier (scalable to 30 days on enterprise tier).
- **Capability**: Point-In-Time Recovery (PITR) to any historical second within the retention window via zero-copy branch creation.

### 1.2 Pre-Migration Safety Snapshots (Warm Tier)
Before executing Django database migrations (`python manage.py migrate`), an automated zero-copy safety branch is created:
```bash
neon branches create \
  --project-id divine-smoke-01982543 \
  --name pre-migration-safety-$(date +%s) \
  --parent production
```
If a schema migration fails or locks critical tables, the application connection string is instantly switched to the pre-migration branch without data loss.

### 1.3 Statutory Encrypted Logical Exports (Cold Tier)
For 7-year HIPAA compliance (45 CFR § 164.312(a)(2)(iv)), automated daily logical backups are executed using PostgreSQL `pg_dump`:
```bash
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --compress=9 \
  --file="cdss_backup_$(date +%Y%m%d_%H%M%S).dump"

# Encrypt and upload to private S3 bucket with KMS envelope encryption
aws s3 cp cdss_backup_*.dump s3://hospital-cdss-backups/postgres/ \
  --sse aws:kms \
  --sse-kms-key-id arn:aws:kms:us-east-2:ACCOUNT:key/HEALTHNOVA-CDSS-BACKUP-KEY
```

---

## 2. Retention Policy Matrix

| Tier | Retention Period | Scope | Storage Location | Deletion Protection |
| :--- | :--- | :--- | :--- | :--- |
| **Hot (PITR)** | 6 to 72 Hours | Continuous WAL transactions | Neon Safekeepers / AWS S3 | Automatic WAL recycling |
| **Warm (Snapshots)** | 7 Days | Pre-migration & pre-release branches | Neon Zero-Copy Branch Storage | Branch protection rules |
| **Cold (Logical)** | 30 Days | Daily compressed, encrypted dumps | AWS S3 Standard-IA | S3 Lifecycle Expiration |
| **Archive (Regulatory)** | 7 Years | Monthly snapshots & annual audit ledgers | AWS S3 Glacier Flexible Retrieval | S3 Object Lock (WORM compliance) |

---

## 3. Cryptographic Validation & Integrity Probes

A backup is **NEVER** reported as successful simply because a file was written. Every backup must pass validation:
1. **Completion Check**: Exit code 0 from export pipeline.
2. **SHA-256 Checksum**: Generated immediately upon compression and verified against the storage manifest.
3. **Archive Header Verification**: `pg_restore --list <dump_file>` executed to verify TOC integrity.
4. **Size Anomaly Detection**: Alerts if export size drops > 20% compared to historical baseline.
5. **Access Verification**: Test reading back from encrypted S3 bucket.

---

## 4. Access Control & PHI Protection

- **IT System Administrators (`IT_ADMIN`)**: Sole role authorized to view, create, or validate backups.
- **Clinicians (Doctors, Nurses)**: Strictly forbidden from accessing backup endpoints (HTTP 403 Forbidden).
- **Medical Informaticists**: Granted read-only access to operational telemetry; zero raw backup download rights.
- **PHI Safeguards**: Production backups are **never** restored onto developer laptops, CI/CD test environments, or public cloud endpoints. Backups are encrypted with AES-256-GCM / AWS KMS at rest and TLS 1.3 in transit.
