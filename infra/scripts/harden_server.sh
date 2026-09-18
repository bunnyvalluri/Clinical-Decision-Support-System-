#!/usr/bin/env bash
set -euo pipefail

# HealthNova AI - Linux Host Hardening Script (Ubuntu 22.04 LTS / Debian)
# Implements CIS Benchmark controls, UFW port blocking, fail2ban, and Docker isolation

if [[ $EUID -ne 0 ]]; then
   echo "Error: This script must be run as root." >&2
   exit 1
fi

echo "==> 1. Updating base packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y ufw fail2ban auditd unattended-upgrades iptables-persistent

echo "==> 2. Configuring UFW Firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp comment "HTTP reverse proxy"
ufw allow 443/tcp comment "HTTPS reverse proxy"

# Only allow SSH from local private subnets or VPN if configured
ufw allow from 10.0.0.0/8 to any port 22 proto tcp comment "Private VPC SSH"
ufw --force enable

echo "==> 3. Hardening SSH Configuration..."
SSHD_CONFIG="/etc/ssh/sshd_config"
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' "$SSHD_CONFIG"
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONFIG"
sed -i 's/^#*PermitEmptyPasswords.*/PermitEmptyPasswords no/' "$SSHD_CONFIG"
sed -i 's/^#*X11Forwarding.*/X11Forwarding no/' "$SSHD_CONFIG"
sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 3/' "$SSHD_CONFIG"
systemctl restart ssh || systemctl restart sshd

echo "==> 4. Configuring Fail2ban..."
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF
systemctl enable fail2ban
systemctl restart fail2ban

echo "==> 5. Hardening Docker Daemon..."
mkdir -p /etc/docker
cat << 'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  },
  "live-restore": true,
  "no-new-privileges": true,
  "icc": false,
  "userland-proxy": false
}
EOF
systemctl daemon-reload
systemctl restart docker || true

echo "==> Linux server hardening complete."
