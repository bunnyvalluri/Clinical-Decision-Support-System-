# HealthNova AI — Infrastructure as Code (OpenTofu) & Cloud Hardening

This directory contains the authoritative Infrastructure-as-Code (IaC) configuration for HealthNova AI, built with **OpenTofu v1.8.x** (open-source MPL-2.0).

---

## Directory Structure

```
infra/
├── environments/               # Target deployment environments
│   ├── development/           # Local/Dev cloud sandbox
│   ├── staging/               # Pre-production validation environment
│   └── production/            # Authoritative production tier (remote state + locking)
├── modules/                   # Reusable, versioned infrastructure modules
│   ├── networking/            # VPC, public/private/data subnets, NAT, IGW
│   ├── firewall/              # Strict security groups (ALB, App, Data)
│   ├── storage/               # Encrypted S3 buckets, versioning, TLS policy
│   ├── server/                # CIS-hardened Ubuntu 22.04 LTS host with IMDSv2
│   └── dns/                   # Route53 records and CAA certificates
├── policies/                  # OPA Rego compliance policies (HIPAA/CIS)
│   ├── network_security.rego  # Disallows 0.0.0.0/0 on sensitive ports
│   ├── encryption.rego        # Requires S3 SSE and EBS encryption
│   └── least_privilege.rego   # Enforces IMDSv2 and public block
└── scripts/                   # Operational automation scripts
    ├── iac_plan.sh            # Safe speculative planning
    ├── iac_apply.sh           # Apply with human production gate
    ├── iac_drift_detect.sh    # Exit-code based drift detection
    └── harden_server.sh       # OS and Docker hardening script
```

---

## Production Invariants & Security Standards

1. **OpenTofu Native**: Powered by OpenTofu `>= 1.8.0`, avoiding proprietary BSL licensing.
2. **Network Isolation**:
   - Public ingress is **strictly** limited to ports 80 (HTTP) and 443 (HTTPS) via reverse proxy.
   - Ports 8000 (Django ASGI), 6379 (Redis), 7700 (Meilisearch), and 11434 (Ollama) are restricted to private subnets.
3. **Storage Encryption**:
   - All S3 buckets enforce default server-side encryption (AES256 or KMS).
   - All S3 buckets reject plain HTTP requests (`aws:SecureTransport: false`).
   - S3 public access block is fully enabled.
4. **Compute Hardening**:
   - Root EBS volumes are gp3 encrypted.
   - IMDSv2 is enforced (`http_tokens = "required"`).
   - Docker daemon configured with `no-new-privileges: true` and `icc: false`.
5. **No Fake Data Policy**:
   - Cost and drift metrics derive strictly from authentic cloud provider APIs or CLI execution.
   - If cost data is not configured, systems explicitly return `Cost data unavailable`.

---

## Operational Commands

### 1. Speculative Plan
```bash
./scripts/iac_plan.sh production
```

### 2. Apply with Approval Gate
```bash
# Production applies require human sign-off
export CONFIRM_PRODUCTION_APPLY=yes
./scripts/iac_apply.sh production
```

### 3. Drift Detection
```bash
./scripts/iac_drift_detect.sh production
```
