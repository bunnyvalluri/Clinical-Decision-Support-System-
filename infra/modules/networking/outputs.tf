output "vpc_id" {
  value       = aws_vpc.main.id
  description = "The ID of the provisioned VPC"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "IDs of the public subnets"
}

output "app_private_subnet_ids" {
  value       = aws_subnet.app_private[*].id
  description = "IDs of the application private subnets"
}

output "data_private_subnet_ids" {
  value       = aws_subnet.data_private[*].id
  description = "IDs of the data private subnets"
}
