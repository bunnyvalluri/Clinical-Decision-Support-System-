terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

data "aws_ami" "ubuntu_lts" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "host" {
  ami                  = data.aws_ami.ubuntu_lts.id
  instance_type        = var.instance_type
  subnet_id            = var.subnet_id
  vpc_security_group_ids = var.security_group_ids
  key_name             = var.key_name
  iam_instance_profile = var.iam_instance_profile

  # Enforce IMDSv2 (HIPAA / CIS Benchmark requirement against SSRF credential theft)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  # Root block device encrypted with gp3
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gb
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name        = "${var.project_name}-${var.environment}-root-ebs"
      Environment = var.environment
      Compliance  = "HIPAA-EBS-Encrypted"
    }
  }

  user_data = <<-EOF
              #!/bin/bash
              set -euo pipefail
              export DEBIAN_FRONTEND=noninteractive

              # 1. Update OS packages & install hardening tools
              apt-get update -y
              apt-get upgrade -y
              apt-get install -y fail2ban auditd ufw unattended-upgrades apt-listchanges curl jq

              # 2. Configure Unattended Security Upgrades
              dpkg-reconfigure -f noninteractive unattended-upgrades

              # 3. Harden SSH Configuration
              sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
              sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
              sed -i 's/^#*X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
              sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 4/' /etc/ssh/sshd_config
              systemctl restart ssh || systemctl restart sshd

              # 4. Enable Fail2ban
              systemctl enable fail2ban
              systemctl start fail2ban

              # 5. Configure Auditd rules
              auditctl -e 1 || true

              # 6. Install Docker with Hardened Daemon Config
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh
              mkdir -p /etc/docker
              cat << 'DOCKER_CFG' > /etc/docker/daemon.json
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
              DOCKER_CFG
              systemctl daemon-reload
              systemctl restart docker

              echo "HealthNova platform server hardening completed successfully."
              EOF

  tags = {
    Name        = "${var.project_name}-${var.environment}-server"
    Environment = var.environment
    Role        = "Application-Host"
    ManagedBy   = "OpenTofu"
  }
}
