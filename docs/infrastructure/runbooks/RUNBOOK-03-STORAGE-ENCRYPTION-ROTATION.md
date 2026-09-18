# RUNBOOK-03: Storage Encryption & Key Rotation

## Objective
Verify S3 server-side encryption (SSE-S3 / SSE-KMS) and rotate KMS customer-managed keys.

## Procedure
1. Confirm S3 default encryption:
   ```bash
   aws s3api get-bucket-encryption --bucket healthnova-production-dr-backups
   ```
2. Verify public access block:
   ```bash
   aws s3api get-public-access-block --bucket healthnova-production-dr-backups
   ```
3. To rotate KMS master keys:
   - Create new KMS key or enable automatic key rotation via AWS KMS console/IaC:
     ```bash
     aws kms enable-key-rotation --key-id <KMS-KEY-ID>
     ```
4. Verify non-TLS requests are denied by uploading a test object via plain HTTP (should fail with HTTP 403).
