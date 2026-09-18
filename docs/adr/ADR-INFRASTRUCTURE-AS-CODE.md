# ADR-INFRASTRUCTURE-AS-CODE: OpenTofu Adoption, Cloud Hardening, Network Isolation & Platform Governance

## Status
Accepted

## Context
HealthNova AI is an enterprise-grade Clinical Decision Support System (CDSS) operating under strict healthcare regulatory standards (HIPAA, HITECH, SOC 2 Type II). The platform orchestrates multi-agent clinical risk scoring, large language model inference (Ollama), vector retrieval (Meilisearch), fast key-value caching (Redis), asynchronous task execution (Celery), and real-time WebSocket alerts (Django Channels).

Historically, application deployment was managed via Coolify PaaS directly on a cloud VM. To ensure reproducible disaster recovery, zero-trust network isolation, and immutable auditability, declarative Infrastructure-as-Code (IaC) and cloud hardening guardrails are mandatory.

Key requirements:
1. Pure open-source IaC tool with no BSL or vendor-lock licensing restrictions.
2. Complete network isolation: Public ingress strictly limited to ports 80/443; internal ports (8000, 6379, 7700, 11434) locked to VPC private subnets.
3. Neon PostgreSQL (`divine-smoke-01982543`) remains the sole authoritative clinical source of truth.
4. Mandatory storage and compute encryption (S3 SSE-S3/KMS, gp3 disk encryption, IMDSv2).
5. Zero Fake Data policy: cost and drift metrics must reflect verified cloud state or report UNAVAILABLE.
6. Safe change management: production applies require explicit human sign-off tokens.

## Decision

### 1. Adoption of OpenTofu v1.8.x
We adopt **OpenTofu v1.8.x** (Linux Foundation, MPL-2.0) as the authoritative IaC engine over Terraform. This eliminates licensing exposure while maintaining 100% HCL syntax compatibility.

### 2. Multi-Tier Network Architecture
- **VPC (`10.0.0.0/16`)**:
  - **Public Subnets (`10.0.1.0/24`, `10.0.2.0/24`)**: AWS ALB and Traefik edge reverse proxies.
  - **App-Private Subnets (`10.0.10.0/24`, `10.0.11.0/24`)**: Coolify Docker host VM and ASGI application instances.
  - **Data-Private Subnets (`10.0.20.0/24`, `10.0.21.0/24`)**: Redis cache, Meilisearch, and Ollama inference nodes.
- **Port Ingress Guardrails**:
  - `0.0.0.0/0` ingress is permitted **only** on ports 80 and 443 at the ALB tier.
  - Port 80 strictly issues HTTP 301 redirects to HTTPS (TLS 1.3).
  - All sensitive ports (22, 6379, 7700, 8000, 11434) are blocked from public internet exposure.

### 3. Compute and Storage Hardening
- **IMDSv2 Mandatory**: All EC2 host instances enforce `http_tokens = "required"` with hop limit 1 to eliminate SSRF exfiltration risks.
- **Disk Encryption**: All EBS root and attached volumes enforce AES-256 / gp3 KMS encryption.
- **Object Storage**: S3 buckets enforce default SSE, Public Access Block, and explicit `aws:SecureTransport: false` denial policies.
- **Docker Host Hardening**: Linux VM hosts are provisioned with `unattended-upgrades`, `fail2ban`, `auditd`, and Docker daemon flags `no-new-privileges: true` and `icc: false`.

### 4. Remote State Concurrency & Locking
- Production OpenTofu state is maintained in an encrypted S3 bucket (`healthnova-production-tofu-state`) with distributed state locking via DynamoDB (`healthnova-production-tofu-locks`).
- Direct local applies against production state are strictly blocked by CI/CD environment protections.

### 5. Platform Governance & Change Management
- Speculative execution plans (`tofu plan`) are generated automatically on pull requests.
- Production applies require explicit human approval (`CONFIRM_PRODUCTION_APPLY=yes` or UI sign-off token).
- Automated drift detection checks run periodically and on-demand via `tofu plan -detailed-exitcode`.

## Consequences

### Positive
- **Deterministic Reproducibility**: The entire cloud environment can be reconstructed from zero within target RTO bounds.
- **Audit Compliance**: Every infrastructure modification is tracked via Git commits, PR reviews, and immutable Django `AuditLog` records.
- **Zero-Trust Security**: No database or internal caching engine is accessible outside private VPC subnets.

### Negative / Trade-offs
- Operators cannot make manual changes in the AWS Console without triggering drift alerts.
- Production modifications require peer sign-off, introducing minimal latency for change approvals.
