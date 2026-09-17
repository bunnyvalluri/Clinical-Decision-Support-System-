# Architecture Decision Record (ADR): Coolify Integration

**Date**: 2026-09-17  
**Status**: Accepted  
**Deciders**: Senior DevOps, Cloud Architecture, Platform Engineering, SRE, DevSecOps  
**Context**: Prompt 36 — Integration of Coolify as the Infrastructure & Deployment Control Plane

---

## 1. Context and Problem Statement

The HealthNova AI CDSS application requires automated, reproducible, self-hosted deployment automation across Development, Staging, Preview, and Production environments.

Previous manual container runs lacked:
1. Declarative Git-triggered continuous deployments with automated rollbacks.
2. Production-grade reverse proxy orchestration with automatic Let's Encrypt TLS termination.
3. Isolated preview environments for staging PR verifications.
4. Centralized infrastructure observability and health checking.

---

## 2. Decision Drivers

1. **Self-Hosted Compliance (HIPAA / GDPR)**: The entire deployment pipeline and container runner must reside within the enterprise security perimeter; no proprietary code or internal endpoints may be pushed through untrusted third-party clouds.
2. **Neon PostgreSQL as Single Source of Truth**: The deployment tool must **never** replace or self-host the core clinical database.
3. **Control Plane Independence**: The control plane must be decoupled from the runtime workload; an outage of the control plane must not terminate running clinical services.
4. **Strict Least-Privilege RBAC**: Only IT System Administrators may trigger deployments or configure servers. Clinical personas (Doctors, Nurses, Patients) must have zero access.
5. **Human Approval Gate**: Production deployments must require human authorization; autonomous AI agents (Ruflo) are barred from deploying to production without human sign-off.

---

## 3. Considered Options

1. **Kubernetes (k8s / EKS)**: Highly resilient, but excessive complexity and operational overhead for single/multi-node healthcare appliances at this project stage.
2. **Portainer**: Basic container management, but lacks native Git deployment pipelines, automatic preview environments, and robust reverse proxy automation.
3. **Proprietary Cloud (Vercel + Render + Heroku)**: Violates strict healthcare data sovereignty and vendor lock-in guidelines.
4. **Coolify (v4.0.0-beta.380)**: **Selected**. Apache-2.0 self-hosted PaaS, native Git-based Compose deployments, Traefik TLS proxy, API/webhook automation, and preview environments.

---

## 4. Architectural Rules & Invariants

1. **Coolify is NOT the Clinical Backend**: Coolify orchestrates Docker containers. All clinical logic, authentication, and permissions remain in Django REST Framework.
2. **Neon PostgreSQL Remains Authoritative**: Coolify's internal PostgreSQL database stores only platform metadata (applications, servers). Neon stores 100% of patient data.
3. **No Direct Frontend Access to Coolify**: Next.js connects exclusively to Django REST Framework (`/api/v1/infrastructure/`). Coolify API tokens are strictly server-side.
4. **Zero PHI in Logs or Previews**: Preview environments use synthetic data. Build and runtime logs are scrubbed for sensitive credentials and PHI.
5. **Safe Degraded Mode**: If the Coolify API is unreachable, the Django backend opens a circuit breaker, continues serving clinical requests without interruption, and renders an honest "Control plane unavailable" status in the IT Admin dashboard.

---

## 5. Consequences

### Positive
- Declarative, Git-native continuous deployments using version-controlled Compose files.
- Automated Let's Encrypt TLS certificate provisioning via Traefik.
- Ephemeral preview environments for testing pull requests with synthetic data.
- Standardized release gates combining Bruno API contract tests, React Doctor, and human approval.

### Negative / Trade-offs
- The IT Admin team must maintain the Coolify host instance (backup, updates, disk hygiene).
- Database migrations must follow an expand/contract zero-downtime strategy to ensure compatibility during container transitions.
