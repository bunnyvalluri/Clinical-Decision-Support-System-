variable "domain_name" {
  description = "Base domain name (e.g. healthnova.ai)"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "alb_zone_id" {
  description = "Canonical hosted zone ID of the Application Load Balancer"
  type        = string
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
}
