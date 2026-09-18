# HealthNova AI CDSS — Backup Security, Encryption & Ransomware Defense

## 1. Cryptographic Protection Strategy

### 1.1 Encryption in Transit
All database connections, S3 uploads, and node-to-node replication streams strictly require **TLS 1.3** with forward secrecy. Unencrypted plaintext connections are blocked by Neon firewall rules and Coolify reverse proxy configuration.

### 1.2 Encryption at Rest
- **Neon Hot Tier**: Copy-on-write page servers and WAL streams are encrypted with AES-256 at the physical storage layer.
- **Cold Export Tier**: S3 backups use **AWS KMS Envelope Encryption** (`aws:kms`) with a dedicated customer-managed key (CMK).
- **Key Isolation**: The KMS decryption key resides strictly in the AWS KMS Hardware Security Module (HSM). The key is **never** stored on the same server or storage bucket as the backup dumps.

---

## 2. Ransomware Defense Architecture

HealthNova AI employs a 4-pillar defense against ransomware and malicious insider deletion:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RANSOMWARE DEFENSE                              │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Immutable Object Lock  ──> S3 Compliance Mode WORM (No Deletion)   │
│ 2. Isolated Storage VPC   ──> Backup bucket in separate AWS Account   │
│ 3. IAM Least Privilege    ──> Backend cannot delete historical dumps  │
│ 4. Cryptographic Hashing  ──> SHA-256 fingerprint verified on restore  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **WORM Storage (Write Once, Read Many)**: S3 buckets utilize Object Lock with Compliance Retention to prevent deletion or overwriting even by root account credentials.
2. **Account Segregation**: Backup archives are replicated to a segregated disaster recovery AWS account with independent MFA and role boundaries.
3. **No Database Deletion Permissions**: Backend application service accounts hold only `SELECT` and `INSERT` on audit tables; destructive commands (`DROP`, `TRUNCATE`) are blocked by database role permissions.

---

## 3. Secret Isolation & Zero-Plaintext Rule

Under no circumstances are secrets (JWT signing keys, database passwords, TLS private certificates, or API keys) embedded into database dumps or Git repositories.
- Secrets are injected at runtime exclusively via environment variables or managed secrets stores.
- The `SensitiveDataRedactor` scrubbing engine intercepts and masks sensitive tokens matching regex patterns before writing to logs.

---

## 4. Ransomware Recovery Protocol

If unauthorized encryption or data tampering is detected in production:

1. **Isolate Compute Hosts**: Immediately sever network connectivity between affected VM hosts and the database.
2. **Revoke All Credentials**: Revoke database connection strings, Coolify tokens, and API gateway keys.
3. **Forensic Audit Investigation**: Query `AuditLog` records to identify the earliest point of unauthorized activity.
4. **Identify Last Trusted Backup**: Locate the newest verified backup snapshot prior to the tamper event.
5. **Restore in Isolated Cleanroom Environment**: Create a sandbox environment and restore the clean snapshot.
6. **Verify Integrity**: Inspect table row counts, SHA-256 hash chains, and patient census numbers.
7. **Redeploy Trusted Artifacts**: Deploy fresh container images built from audited, immutable Git commit SHAs.
8. **Rotate All System Credentials**: Re-issue fresh database passwords, JWT secrets, and API keys.
9. **Resubscribe Live Traffic**: Cut over traffic and monitor system telemetry for 72 hours.
