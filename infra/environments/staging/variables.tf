variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for staging VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for staging host"
  type        = string
  default     = "t3.xlarge"
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
