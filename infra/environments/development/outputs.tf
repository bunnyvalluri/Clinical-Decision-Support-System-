output "vpc_id" {
  description = "Development VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Development Public Subnet IDs"
  value       = module.networking.public_subnet_ids
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
  description = "Dev S3 Bucket ID"
  value       = module.storage_backups.bucket_id
}

output "server_instance_id" {
  description = "Development Host EC2 Instance ID"
  value       = module.server.instance_id
}
