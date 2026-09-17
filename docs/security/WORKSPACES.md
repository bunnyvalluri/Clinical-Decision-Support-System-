# Ephemeral Workspace Sandboxing

## 1. Directory Structure
All pentest-agents workspaces are created under:
`security_workspaces/<assessment-id>/`
Subdirectories:
- `config/`: Scoped runtime settings and rate limits.
- `targets/`: Redacted target definitions.
- `evidence/`: Redacted reproduction logs and traces.
- `reports/`: Local draft outputs.
- `brain/`: Isolated session memory (isolated from Clinical AI memory).

## 2. 10-State Workspace Lifecycle
`CREATED` -> `AUTHORIZED` -> `PROVISIONING` -> `READY` -> `RUNNING` -> `VALIDATING` -> `COMPLETED` -> `DESTROYING` -> `DESTROYED`
Workspaces are deleted immediately upon task completion or failure.
