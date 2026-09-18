output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.host.id
}

output "private_ip" {
  description = "The private IP address of the instance"
  value       = aws_instance.host.private_ip
}

output "public_ip" {
  description = "The public IP address of the instance if attached"
  value       = aws_instance.host.public_ip
}
