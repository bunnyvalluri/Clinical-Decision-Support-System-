variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "healthnova"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "instance_type" {
  description = "EC2 Instance type (e.g. t3.xlarge or c6i.xlarge for clinical inference)"
  type        = string
  default     = "t3.xlarge"
}

variable "subnet_id" {
  description = "Subnet ID where the host will be deployed"
  type        = string
}

variable "security_group_ids" {
  description = "Security groups associated with the instance"
  type        = list(string)
}

variable "key_name" {
  description = "Optional SSH key pair name"
  type        = string
  default     = null
}

variable "iam_instance_profile" {
  description = "IAM instance profile name"
  type        = string
  default     = null
}

variable "root_volume_size_gb" {
  description = "Size of the root EBS volume in GB"
  type        = number
  default     = 80
}
