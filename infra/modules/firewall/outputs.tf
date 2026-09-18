output "alb_security_group_id" {
  description = "Security Group ID of the public Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "Security Group ID of the internal application tier"
  value       = aws_security_group.app.id
}

output "data_security_group_id" {
  description = "Security Group ID of the internal data & cache tier"
  value       = aws_security_group.data.id
}
