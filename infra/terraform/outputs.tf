output "public_ip" {
  description = "Elastic IP of the EC2 instance (use this for DNS A record)"
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_eip.app.public_ip}"
}

# ─── Email / Route 53 ───

output "route53_nameservers" {
  description = "Set these 4 nameservers in your domain registrar to delegate DNS to Route 53"
  value       = aws_route53_zone.main.name_servers
}

output "ses_domain_identity_arn" {
  description = "SES domain identity ARN"
  value       = aws_ses_domain_identity.main.arn
}

# ─── ECR (Docker Registry) ───

output "ecr_api_url" {
  description = "ECR repository URL for API image"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_ui_url" {
  description = "ECR repository URL for UI image"
  value       = aws_ecr_repository.ui.repository_url
}

# ─── Storage / CDN ───

output "s3_bucket_name" {
  description = "S3 bucket name for tenant images"
  value       = aws_s3_bucket.images.id
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain for serving images"
  value       = aws_cloudfront_distribution.images.domain_name
}
