# Secrets Management & Credential Isolation

## Secret Storage Principles
- **No Plaintext Secrets**: Passwords, API tokens, and database connection strings are never committed to Git.
- **Provider**: AWS Secrets Manager / Vault / Coolify encrypted environment variables.
- **Access Control**: Least-privilege IAM roles inject secrets at container runtime.
- **Rotation**: Automated 90-day rotation for service API keys and database credentials.
