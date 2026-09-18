variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket name"
  type        = string
  default     = "healthnova"
}

variable "bucket_suffix" {
  description = "Suffix describing bucket purpose (e.g. backups, artifacts, models)"
  type        = string
  default     = "storage"
}

variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
}

variable "kms_key_arn" {
  description = "Optional KMS Key ARN for encryption; if null, defaults to AES256"
  type        = string
  default     = null
}

variable "transition_to_ia_days" {
  description = "Days before noncurrent versions transition to Standard-IA"
  type        = number
  default     = 30
}

variable "noncurrent_version_expiration_days" {
  description = "Days before noncurrent versions permanently expire"
  type        = number
  default     = 90
}
