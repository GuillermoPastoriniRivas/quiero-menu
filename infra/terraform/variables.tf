variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Name of the SSH key pair (must already exist in AWS)"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH (your IP). Use x.x.x.x/32"
  type        = string
  default     = "0.0.0.0/0"
}

variable "app_name" {
  description = "Application name used for tagging"
  type        = string
  default     = "quiero-menu"
}

variable "domain" {
  description = "Primary domain name"
  type        = string
  default     = "quiero.menu"
}

variable "alerts_email" {
  description = "Email address that receives CloudWatch alarm notifications"
  type        = string
}

variable "inbound_mail_recipients" {
  description = "Mailboxes that receive inbound email via SES (MX). Each one must confirm the SNS subscription once."
  type        = list(string)
  default     = ["contact@quiero.menu"]
}

variable "inbound_mail_forward_to" {
  description = "Real mailbox that receives inbound mail forwarded via SNS"
  type        = string
}
