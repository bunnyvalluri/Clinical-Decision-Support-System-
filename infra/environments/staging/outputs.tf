output "vpc_id" {
  description = "Staging VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Staging Public Subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "app_subnet_ids" {
  description = "Staging App Subnet IDs"
  value       = module.networking.app_subnet_ids
}

output "alb_security_group_id" {
  description = "ALB Security Group ID"
  value       = module.firewall.alb_security_group_id
}

output "app_security_group_id" {
  description = "App Security Group ID"
  value       = module.firewall.app_security_group_id
}

output "backup_bucket_id" {
  description = "DR Backup S3 Bucket ID"
  value       = module.storage_backups.bucket_id
}

output "server_instance_id" {
  description = "Staging Host EC2 Instance ID"
  value       = module.server.instance_id
}
