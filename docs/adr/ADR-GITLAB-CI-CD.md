# ADR-GITLAB-CI-CD: Dual-Pipeline Architecture with GitLab CI/CD Integration

## Status
**ACCEPTED** (Date: 2026-09-18)

## Context
HealthNova AI is a mission-critical Clinical Decision Support System (CDSS) requiring rigorous reliability, security, and healthcare data safety. The application was previously validated via GitHub Actions for repository quality checks and PR verification. However, enterprise deployment workflows, container registry tracking, multi-tier environment auditing, and scheduled high-intensity ML benchmark runs require an enterprise-grade CI/CD orchestration engine capable of GitLab mirroring without disrupting existing GitHub Actions.

## Decision
We adopt a **complementary dual-pipeline model**:
1. **GitHub Actions (`.github/workflows/ci.yml`, `cd.yml`)**:
   - Manages inner-loop developer experience and PR validation on GitHub.
   - Enforces 12 strict sequential verification stages prior to merging.

2. **GitLab CI/CD (`.gitlab-ci.yml`, `.gitlab/ci/*.yml`)**:
   - Acts as the enterprise mirror and continuous delivery orchestrator.
   - Manages immutable image builds with GitLab Container Registry.
   - Enforces environment boundaries (`development`, `staging`, `production`).
   - Restricts production release behind a mandatory manual clinician approval gate (`when: manual`).
   - Separates Fast CI from heavy Kaggle ML benchmark runs via GitLab scheduled pipelines.

3. **Shared Single Source of Truth**:
   - Both pipelines invoke identical shell scripts under `scripts/ci/` to ensure deterministic parity across GitHub and GitLab runners.

## Consequences
- **Positive**: Complete portability across GitHub and GitLab; zero risk of divergent verification rules; strict adherence to healthcare safety invariants.
- **Positive**: Neon PostgreSQL authoritative store is protected by running all CI suites against disposable isolated containers (`postgres:15`).
- **Mitigation**: Secrets and credentials are managed through protected, masked environment variables with zero plaintext persistence.
