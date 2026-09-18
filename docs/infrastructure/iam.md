# IAM & Least-Privilege Role Policies

## Identity and Access Management

1. **Host Role (`healthnova-app-host-role`)**:
   - `AmazonSSMManagedInstanceCore`: Enables secure passwordless terminal sessions without public SSH.
   - `CloudWatchAgentServerPolicy`: Pushes system metrics and logs.
   - S3 scoped permissions: Write access strictly limited to `healthnova-*-dr-backups`.
2. **CI/CD Role (`healthnova-github-actions-role`)**:
   - OpenID Connect (OIDC) authentication without long-lived AWS keys.
   - Scoped to execute `tofu plan` and `tofu apply` in target environments.
