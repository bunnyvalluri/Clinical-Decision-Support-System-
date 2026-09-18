# GitHub Actions vs. GitLab CI/CD Responsibility Matrix

## Operational Separation of Responsibilities

To avoid conflicting deployment systems or split-brain releases, responsibilities are strictly separated:

| Dimension | GitHub Actions (`.github/workflows/`) | GitLab CI/CD (`.gitlab-ci.yml`) |
|---|---|---|
| **Primary Role** | Open-source/PR automation, developer inner loop | Enterprise mirror, deployment orchestration, registry |
| **Trigger Matrix** | Push & PRs on `main`, `develop` | Branch pushes, tags, scheduled pipelines, webhooks |
| **Quality Gates** | Pull request approval gates, spec validation, fast lint | Extended multi-stage validation, full integration suites |
| **Artifact Registry** | GitHub Packages / Ephemeral artifacts | GitLab Container Registry (`$CI_REGISTRY_IMAGE`) |
| **Environments** | Ephemeral preview environments | Persistent environments: `staging`, `production` |
| **Production Gate** | Manual repository tag / release | Protected manual gate (`when: manual`) with approval |
| **Authoritative Store**| Read-only test validation | Read-only test validation (Production Neon is sacred) |

---

## Single Source of Truth Principle

To ensure GitHub Actions and GitLab CI do not diverge, both pipelines invoke identical shell scripts located under [`scripts/ci/`](file:///c:/4-1/scripts/ci/):
- `scripts/ci/frontend-lint.sh`
- `scripts/ci/frontend-typecheck.sh`
- `scripts/ci/frontend-test.sh`
- `scripts/ci/frontend-build.sh`
- `scripts/ci/backend-lint.sh`
- `scripts/ci/backend-check.sh`
- `scripts/ci/backend-test.sh`
- `scripts/ci/ml-validate.sh`
- `scripts/ci/security-scan.sh`
- `scripts/ci/health-check.sh`
