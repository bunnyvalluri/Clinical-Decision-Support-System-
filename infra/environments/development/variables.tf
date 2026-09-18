variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for development VPC"
  type        = string
  default     = "10.2.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for development host"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Optional SSH key pair name"
  type        = string
  default     = null
}

variable "admin_cidr_blocks" {
  description = "List of approved admin CIDRs for secure SSH bastion"
  type        = list(string)
  default     = []
}
