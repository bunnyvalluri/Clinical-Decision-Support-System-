variable "vpc_id" {
  description = "VPC ID where security groups will be created"
  type        = string
}

variable "environment" {
  description = "Target deployment environment (development, staging, production)"
  type        = string
}

variable "project_name" {
  description = "Project name prefix for naming resources"
  type        = string
  default     = "healthnova"
}

variable "admin_cidr_blocks" {
  description = "List of approved admin CIDRs allowed for SSH bastion access"
  type        = list(string)
  default     = []
}
