# Infrastructure Troubleshooting Guide

## Common Incident Scenarios & Resolutions

### 1. OpenTofu State Lock Stale Error
- **Symptom**: `Error acquiring the state lock: ConditionalCheckFailedException`.
- **Cause**: Previous apply process was interrupted before releasing DynamoDB mutex.
- **Resolution**:
  1. Verify no other CI/CD pipeline is actively running.
  2. Identify lock ID from error message.
  3. Execute `tofu force-unlock <LOCK-ID>` after obtaining incident commander approval.

### 2. Port Ingress Failure (502 Bad Gateway)
- **Symptom**: External clients receive 502 Bad Gateway on `app.healthnova.ai`.
- **Resolution**:
  1. Check ALB target group health status.
  2. Verify App Security Group (`app-sg`) allows ingress on 8000/3000 from `alb-sg`.
  3. Verify Docker container process is listening (`docker ps`).

### 3. S3 403 Forbidden on Backup Upload
- **Symptom**: DR backup script fails with 403 Access Denied.
- **Resolution**:
  1. Verify the client requests use HTTPS (bucket policy denies non-TLS traffic).
  2. Check IAM instance profile has `s3:PutObject` on `healthnova-*-dr-backups`.
