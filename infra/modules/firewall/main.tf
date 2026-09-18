terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

# -----------------------------------------------------------------------------
# Ingress / ALB Security Group
# Only 80 (redirect to 443) and 443 (TLS) allowed from public internet
# -----------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Public ALB security group - strictly TLS 443 and HTTP 80"
  vpc_id      = var.vpc_id

  ingress {
    description      = "HTTP from anywhere (redirects to HTTPS)"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "HTTPS TLS 1.3 from anywhere"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Environment = var.environment
    ManagedBy   = "OpenTofu"
    Compliance  = "HIPAA-HITECH"
  }
}

# -----------------------------------------------------------------------------
# Application Tier Security Group (Coolify Host / Django ASGI / Next.js)
# Only accepts traffic from ALB SG; NO DIRECT PUBLIC ACCESS
# -----------------------------------------------------------------------------
resource "aws_security_group" "app" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Application tier security group - internal access only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "ASGI Django port 8000 from ALB only"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Next.js frontend port 3000 from ALB only"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Coolify Web UI / Webhook ingress from ALB only"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Bastion / Admin SSH access restricted to admin CIDR
  dynamic "ingress" {
    for_each = length(var.admin_cidr_blocks) > 0 ? [1] : []
    content {
      description = "Hardened SSH from designated admin CIDR"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.admin_cidr_blocks
    }
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-sg"
    Environment = var.environment
    ManagedBy   = "OpenTofu"
    Tier        = "Application"
  }
}

# -----------------------------------------------------------------------------
# Data & Cache Tier Security Group (Redis, Ollama, Meilisearch)
# Strictly isolated - only accessible from App SG
# -----------------------------------------------------------------------------
resource "aws_security_group" "data" {
  name        = "${var.project_name}-${var.environment}-data-sg"
  description = "Data & Cache internal tier - accessible exclusively from app tier"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis port 6379 from app tier"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "Meilisearch port 7700 from app tier"
    from_port       = 7700
    to_port         = 7700
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "Ollama LLM port 11434 from app tier"
    from_port       = 11434
    to_port         = 11434
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Outbound to private subnet services"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-data-sg"
    Environment = var.environment
    ManagedBy   = "OpenTofu"
    Tier        = "Data"
  }
}
