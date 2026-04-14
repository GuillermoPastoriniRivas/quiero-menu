# ─────────────────────────────────────────────────
# Route 53 Hosted Zone for quiero.menu
# ─────────────────────────────────────────────────

resource "aws_route53_zone" "main" {
  name = var.domain

  tags = {
    Name = var.domain
  }
}

# ─────────────────────────────────────────────────
# DNS records
# ─────────────────────────────────────────────────

resource "aws_route53_record" "root_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain}"
  type    = "CNAME"
  ttl     = 300
  records = [var.domain]
}

# ─────────────────────────────────────────────────
# SES Domain Identity + Verification
# ─────────────────────────────────────────────────

resource "aws_ses_domain_identity" "main" {
  domain = var.domain
}

resource "aws_route53_record" "ses_verification" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_amazonses.${var.domain}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.main.verification_token]
}

resource "aws_ses_domain_identity_verification" "main" {
  domain     = aws_ses_domain_identity.main.id
  depends_on = [aws_route53_record.ses_verification]
}

# ─────────────────────────────────────────────────
# DKIM (3 CNAME records)
# ─────────────────────────────────────────────────

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

resource "aws_route53_record" "dkim" {
  count   = 3
  zone_id = aws_route53_zone.main.zone_id
  name    = "${aws_ses_domain_dkim.main.dkim_tokens[count.index]}._domainkey.${var.domain}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.main.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

# ─────────────────────────────────────────────────
# Custom MAIL FROM domain (mail.quiero.menu)
# ─────────────────────────────────────────────────

resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.domain}"
}

resource "aws_route53_record" "mail_from_mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "mail.${var.domain}"
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "mail.${var.domain}"
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}

# ─────────────────────────────────────────────────
# SPF + DMARC for root domain
# ─────────────────────────────────────────────────

resource "aws_route53_record" "root_spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}

resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.${var.domain}"
  type    = "TXT"
  ttl     = 600
  records = ["v=DMARC1; p=quarantine; rua=mailto:contact@${var.domain}"]
}

# ─────────────────────────────────────────────────
# IAM Role + Instance Profile for EC2 → SES + S3
# ─────────────────────────────────────────────────

resource "aws_iam_role" "ec2" {
  name = "${var.app_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = {
    Name = "${var.app_name}-ec2-role"
  }
}

resource "aws_iam_role_policy" "ses_send" {
  name = "${var.app_name}-ses-send"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = "*"
      Condition = {
        StringEquals = {
          "ses:FromAddress" = ["no-reply@${var.domain}", "contact@${var.domain}"]
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "s3_access" {
  name = "${var.app_name}-s3-access"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.images.arn,
        "${aws_s3_bucket.images.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy" "ecr_pull" {
  name = "${var.app_name}-ecr-pull"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.app_name}-cloudwatch-logs"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ]
      Resource = "arn:aws:logs:${var.aws_region}:*:*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.app_name}-ec2-profile"
  role = aws_iam_role.ec2.name
}
