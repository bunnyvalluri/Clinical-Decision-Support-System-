variable "environment" {
  type        = string
  description = "Deployment environment (development, staging, production)"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "Base CIDR block for the clinical VPC"
}

variable "availability_zones" {
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b"]
  description = "Target AWS Availability Zones (us-east-2 for Neon locality)"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
  description = "CIDR blocks for public ingress subnets"
}

variable "app_private_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
  description = "CIDR blocks for application tier subnets"
}

variable "data_private_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
  description = "CIDR blocks for data and cache subnets"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Standard resource tags"
}
