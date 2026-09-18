# Disaster Recovery Infrastructure Rebuild

## Complete Cloud Environment Reconstitution

If an entire cloud region suffers catastrophic loss, the HealthNova platform is re-created using OpenTofu from the authoritative Git repository.

### Rebuild Sequence (Target RTO < 30 minutes)
1. **Target Region Selection**:
   - Update `aws_region` variable in `infra/environments/production/terraform.tfvars`.
2. **Apply Core IaC**:
   ```bash
   cd infra/environments/production
   tofu init
   tofu apply -auto-approve
   ```
3. **Restore Authoritative Neon Database**:
   - Verify Neon PostgreSQL endpoint connectivity.
   - Run point-in-time restore or apply verified SQL backup from secondary S3 bucket.
4. **Provision Coolify Host**:
   - Run `./infra/scripts/harden_server.sh`.
   - Restore Coolify configuration and deploy Docker stacks.
5. **Update DNS Records**:
   - Point Route53 alias records to new ALB DNS name.
6. **Execute Clinical Validation**:
   - Run hermetic test suite and verify AI agent health endpoints.
