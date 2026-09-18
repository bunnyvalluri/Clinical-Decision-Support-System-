# RUNBOOK-04: Server Hardening Verification

## Objective
Audit host OS configuration against CIS Benchmark standards and Docker isolation controls.

## Verification Checklist
1. **SSH Root Login Disabled**:
   ```bash
   grep -E "^PermitRootLogin" /etc/ssh/sshd_config # Expect: PermitRootLogin no
   ```
2. **Password Authentication Disabled**:
   ```bash
   grep -E "^PasswordAuthentication" /etc/ssh/sshd_config # Expect: PasswordAuthentication no
   ```
3. **Fail2ban Service**:
   ```bash
   systemctl status fail2ban # Expect: active (running)
   ```
4. **Auditd Daemon**:
   ```bash
   systemctl status auditd # Expect: active (running)
   ```
5. **Docker Hardened Config**:
   ```bash
   docker info --format '{{json .SecurityOptions}}' # Verify no-new-privileges and seccomp
   ```
