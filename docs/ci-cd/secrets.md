# Secrets Management & CI/CD Variables Policy

## Mandatory Security Invariants
1. **ZERO Plaintext Credentials**: No secrets, passwords, tokens, or private keys may ever be committed to the repository or printed in CI logs.
2. **Protected & Masked Variables**: All sensitive parameters must be configured as **Masked** and **Protected** in GitLab CI/CD Settings (`Settings > CI/CD > Variables`).
3. **No Production Access in Normal CI**: Standard pipeline jobs operate strictly on ephemeral containers and disposable PostgreSQL/Redis instances.

---

## Required GitLab CI/CD Variables

| Variable Name | Purpose | Scope | Protected | Masked |
|---|---|---|---|---|
| `CI_REGISTRY_USER` | Container registry username | Global | Yes | No |
| `CI_REGISTRY_PASSWORD` | Container registry password / token | Global | Yes | Yes |
| `COOLIFY_WEBHOOK_URL_STAGING` | Webhook URL for Staging deploy | `staging` | Yes | Yes |
| `COOLIFY_WEBHOOK_URL_PROD` | Webhook URL for Production deploy | `production` | Yes | Yes |
| `GITLAB_WEBHOOK_SECRET_TOKEN`| Verification token for incoming events | Global | Yes | Yes |
| `KAGGLE_USERNAME` | Kaggle API account username | Scheduled only | Yes | No |
| `KAGGLE_KEY` | Kaggle API programmatic token | Scheduled only | Yes | Yes |
