# HealthNova AI CDSS — Database & System Restoration Procedures

## 1. Database Point-In-Time Restoration Procedure (Neon PITR)

When data corruption, accidental table modification, or application malfunction occurs, follow this exact procedure:

```
[ Incident Detected ]
          │
          ▼
[ Stop Unsafe Writes ] (Set app to maintenance or scale ASGI instances to 0)
          │
          ▼
[ Identify Recovery Point ] (Determine exact UTC timestamp prior to incident)
          │
          ▼
[ Create Neon Recovery Branch ] (Zero-copy branching from target timestamp)
          │
          ▼
[ Validate Schema & Data Integrity ] (Check patient census, predictions, audit ledger)
          │
          ▼
[ Promote Recovery Branch to Default ]
          │
          ▼
[ Update DATABASE_URL & Restart Containers ]
          │
          ▼
[ Execute 14-Point Verification Checklist ]
          │
          ▼
[ Resume Clinical Services & Monitor ]
```

### Step 1: Identify Incident Recovery Timestamp
Identify the exact UTC timestamp 1 second prior to the incident:
```bash
TARGET_TIMESTAMP="2026-09-18T14:30:00Z"
```

### Step 2: Create Recovery Branch via Neon CLI or Console
Do **NOT** drop or write over the existing production branch. Branch from the exact historical point:
```bash
neon branches create \
  --project-id divine-smoke-01982543 \
  --name recovery-pitr-$(date +%s) \
  --parent production \
  --timestamp "$TARGET_TIMESTAMP"
```

### Step 3: Connect and Validate Clinical Integrity
Execute non-destructive integrity queries against the recovery branch endpoint:
```sql
-- 1. Verify patient census
SELECT count(*) FROM clinical_patients;

-- 2. Verify latest valid clinical record
SELECT max(created_at) FROM clinical_clinicalrecord;

-- 3. Verify ML risk predictions
SELECT count(*) FROM predictions_prediction;

-- 4. Verify 21 CFR Part 11 audit ledger integrity
SELECT count(*), max(timestamp) FROM audit_logs;
```

### Step 4: Promote Recovery Branch to Primary Default
Once data integrity is confirmed by the Lead Clinical Informaticist and IT Administrator:
```bash
neon branches set-default recovery-pitr-xxx --project-id divine-smoke-01982543
```
Update `DATABASE_URL` in Coolify / Docker environment and restart Daphne ASGI and Celery workers:
```bash
docker compose restart backend celery_worker
```

---

## 2. Restoration from Encrypted Cold Dump (`pg_dump`)

If a total cloud region outage requires rebuilding onto an alternate VPC or isolated DR environment:

```bash
# 1. Download encrypted archive
aws s3 cp s3://hospital-cdss-backups/postgres/cdss_backup_TARGET.dump.enc .

# 2. Decrypt using AWS KMS key
aws kms decrypt \
  --ciphertext-blob fileb://cdss_backup_TARGET.dump.enc \
  --output text --query Plaintext | base64 --decode > cdss_backup_TARGET.dump

# 3. Verify SHA-256 checksum
sha256sum cdss_backup_TARGET.dump

# 4. Restore into target PostgreSQL database
pg_restore \
  --dbname="$NEW_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  cdss_backup_TARGET.dump
```

---

## 3. The 14-Point Restoration Verification Checklist

A recovery is strictly **NOT** considered successful until all 14 criteria pass:

- [ ] **1. Service Starts**: Container daemon and ASGI process boot cleanly.
- [ ] **2. Database Connects**: Connection pool successfully queries `SELECT 1;`.
- [ ] **3. Schema Valid**: `django_migrations` table matches current codebase.
- [ ] **4. APIs Respond**: `/api/v1/infrastructure/health/` returns HTTP 200.
- [ ] **5. Authentication Works**: Staff logins with Argon2id and JWT issuance functional.
- [ ] **6. RBAC Enforced**: Doctor, Nurse, Informaticist, and Admin boundaries respected.
- [ ] **7. WebSockets Functional**: Daphne ASGI handles WebSocket connection requests.
- [ ] **8. Celery Works**: Workers consume tasks from Redis queues without stalling.
- [ ] **9. ML Model Loads**: Model artifacts load into memory without deserialization errors.
- [ ] **10. Model Version Correct**: Active version matches approved Model Registry row.
- [ ] **11. Dataset Lineage Intact**: Kaggle dataset metadata and SHA-256 fingerprint verified.
- [ ] **12. Audit Logging Active**: Append-only `AuditLog` records new events.
- [ ] **13. Health Checks Pass**: Metrics, AlertService, and Prometheus probes report healthy.
- [ ] **14. No Secrets Exposed**: SensitiveDataRedactor actively sanitizes logs and payloads.
