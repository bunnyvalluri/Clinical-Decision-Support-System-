output "app_fqdn" {
  description = "Fully qualified domain name for the frontend application"
  value       = aws_route53_record.app.fqdn
}

output "api_fqdn" {
  description = "Fully qualified domain name for the backend API"
  value       = aws_route53_record.api.fqdn
}

output "zone_id" {
  description = "Route53 zone ID"
  value       = data.aws_route53_zone.primary.zone_id
}
