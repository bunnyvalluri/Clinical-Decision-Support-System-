# Cloud Infrastructure Hardening & Security Standards

## Security Baseline Controls

1. **CIS Benchmark Level 2 Compliance**:
   - Automated kernel parameter tuning (`sysctl` network hardening).
   - `auditd` process accounting active.
   - `fail2ban` SSH protection with 3 max retries.
2. **IMDSv2 Mandatory**:
   - `http_tokens = "required"`.
   - `http_put_response_hop_limit = 1`.
   - Prevents SSRF attacks against container workloads from stealing EC2 instance metadata credentials.
3. **EBS Encryption**:
   - Default gp3 encryption with KMS keys for all root and attached EBS block devices.
4. **Container Isolation**:
   - Docker daemon configured with `no-new-privileges: true` and `icc: false`.
   - Application containers run strictly as non-root user `healthnova` (UID 1001).
   - `/var/run/docker.sock` is strictly forbidden inside application containers.
