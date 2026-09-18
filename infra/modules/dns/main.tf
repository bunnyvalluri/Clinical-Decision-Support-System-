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
# Route53 Hosted Zone lookup (or creation if managed)
# -----------------------------------------------------------------------------
data "aws_route53_zone" "primary" {
  name         = var.domain_name
  private_zone = false
}

# -----------------------------------------------------------------------------
# Frontend Application Record (e.g. app.healthnova.ai)
# -----------------------------------------------------------------------------
resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.environment == "production" ? "app.${var.domain_name}" : "app-${var.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# -----------------------------------------------------------------------------
# Backend API Record (e.g. api.healthnova.ai)
# -----------------------------------------------------------------------------
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.environment == "production" ? "api.${var.domain_name}" : "api-${var.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# -----------------------------------------------------------------------------
# CAA Record - Enforce Strict Certificate Authorities (HIPAA / TLS Security)
# -----------------------------------------------------------------------------
resource "aws_route53_record" "caa" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "CAA"
  ttl     = 300

  records = [
    "0 issue \"amazon.com\"",
    "0 issue \"letsencrypt.org\"",
    "0 issuewild \";\"",
    "0 iodef \"mailto:security@healthnova.ai\""
  ]
}
