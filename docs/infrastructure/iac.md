# Infrastructure as Code (OpenTofu) Guide

## Toolchain
- **Engine**: OpenTofu v1.8.x (MPL-2.0)
- **State Store**: S3 (`healthnova-production-tofu-state`) with SSE-S3 encryption
- **Concurrency Locking**: DynamoDB (`healthnova-production-tofu-locks`)
- **Modules**: `networking`, `firewall`, `storage`, `server`, `dns`

## Execution Workflow

1. **Local Syntax & Format Check**:
   ```bash
   tofu fmt -check -recursive infra/
   ```
2. **Module Validation**:
   ```bash
   tofu -chdir=infra/modules/networking validate
   ```
3. **Speculative Plan**:
   ```bash
   ./infra/scripts/iac_plan.sh production
   ```
4. **Controlled Apply**:
   ```bash
   export CONFIRM_PRODUCTION_APPLY=yes
   ./infra/scripts/iac_apply.sh production
   ```

## State File Protection
- `.tfstate` and `*.tfstate.*` are strictly excluded in `.gitignore`.
- State encryption in S3 prevents leakage of metadata.
- Access to the state bucket is restricted to CI/CD IAM roles.
