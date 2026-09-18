output "vpc_id" {
  description = "Production VPC ID"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Production Public Subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "app_subnet_ids" {
  description = "Production App Subnet IDs"
  value       = module.networking.app_subnet_ids
}

output "data_subnet_ids" {
  description = "Production Data Subnet IDs"
  value       = module.networking.data_subnet_ids
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

output "backup_bucket_arn" {
  description = "DR Backup S3 Bucket ARN"
  value       = module.storage_backups.bucket_arn
}

output "server_instance_id" {
  description = "Production Host EC2 Instance ID"
  value       = module.server.instance_id
}

output "server_private_ip" {
  description = "Production Host Private IP"
  value       = module.server.private_ip
}
