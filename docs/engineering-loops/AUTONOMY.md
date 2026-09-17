# Autonomy Levels (L1, L2, L3)

## L1 — Report Only (Default)
- **Permissions**: Read-only repository inspection, health checks, dependency auditing.
- **Restrictions**: Cannot create commits, mutate files, or submit pull requests.

## L2 — Assisted
- **Permissions**: Create isolated worktrees, propose candidate patches, run tests.
- **Restrictions**: Must pass Maker/Checker verification and require human dual-custody approval before PR creation or branch push.

## L3 — Controlled Unattended
- **Permissions**: Auto-remediation of strictly allowlisted non-destructive issues (e.g. stale branch cleanup, lint whitespace fixes).
- **Restrictions**: Strictly forbidden from touching clinical paths, models, or production deployment.
