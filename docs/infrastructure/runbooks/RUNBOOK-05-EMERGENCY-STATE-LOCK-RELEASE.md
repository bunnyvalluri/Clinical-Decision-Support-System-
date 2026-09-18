# RUNBOOK-05: Emergency State Lock Release

## Objective
Safely clear a stale OpenTofu DynamoDB distributed lock when an apply process crashed.

## Caution
Releasing a state lock while another process is actively mutating cloud resources can corrupt the infrastructure state file.

## Procedure
1. Confirm that no GitHub Actions or GitLab CI job is actively running against production.
2. Note Lock ID from error: `Lock Info: ID: 2b8f9e12-4c21-4d2a-b089-6cb2e76f9d2a`.
3. Obtain written approval from Platform Lead / Incident Commander.
4. Execute unlock:
   ```bash
   cd infra/environments/production
   tofu force-unlock 2b8f9e12-4c21-4d2a-b089-6cb2e76f9d2a
   ```
5. Run speculative plan to confirm state integrity:
   ```bash
   tofu plan -no-color
   ```
