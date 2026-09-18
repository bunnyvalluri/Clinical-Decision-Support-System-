variable "aws_region" {
  description = "AWS deployment region (e.g. us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for production VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for production host (Coolify/Docker/Workers)"
  type        = string
  default     = "c6i.2xlarge"
}

variable "key_name" {
  description = "Optional SSH key pair name"
  type        = string
  default     = null
}

variable "admin_cidr_blocks" {
  description = "List of approved admin CIDRs for secure bastion / administrative ingress"
  type        = list(string)
  default     = []
}
