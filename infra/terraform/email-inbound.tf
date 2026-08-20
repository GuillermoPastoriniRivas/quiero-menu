# ─────────────────────────────────────────────────
# SES Inbound email (MX → S3 + SNS al buzón real)
# Replica el patrón de asis/correo-entrante: el MX
# recibe el mail, el receipt rule lo guarda en S3 y
# notifica por SNS. Sin Lambda (cuenta AWS con
# creación de funciones bloqueada).
# ─────────────────────────────────────────────────

resource "aws_route53_record" "root_mx_inbound" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "MX"
  ttl     = 600
  records = ["10 inbound-smtp.${var.aws_region}.amazonses.com"]
}

# Solo puede haber UN receipt rule set activo por
# cuenta y región: usamos el que ya está activo
# (compartido con otros proyectos) y agregamos una
# regla nueva, sin activar otro rule set.
data "aws_ses_active_receipt_rule_set" "main" {}

resource "aws_ses_receipt_rule" "inbound" {
  name          = "${var.app_name}-inbound"
  rule_set_name = data.aws_ses_active_receipt_rule_set.main.rule_set_name
  enabled       = true
  scan_enabled  = true
  recipients    = var.inbound_mail_recipients

  s3_action {
    bucket_name       = aws_s3_bucket.inbound_mail.id
    object_key_prefix = "inbound/"
    position          = 1
  }

  sns_action {
    topic_arn = aws_sns_topic.inbound_mail.arn
    position  = 2
  }
}

# ─────────────────────────────────────────────────
# S3: copia fiel del mail (30 días)
# ─────────────────────────────────────────────────

resource "aws_s3_bucket" "inbound_mail" {
  bucket = "${var.app_name}-inbound-mail"
}

resource "aws_s3_bucket_public_access_block" "inbound_mail" {
  bucket                  = aws_s3_bucket.inbound_mail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "inbound_mail" {
  bucket = aws_s3_bucket.inbound_mail.id

  rule {
    id     = "retention-30-days"
    status = "Enabled"

    filter {
      prefix = "inbound/"
    }

    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_policy" "inbound_mail" {
  bucket = aws_s3_bucket.inbound_mail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ses.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.inbound_mail.arn}/*"
        Condition = {
          StringEquals = {
            "aws:Referer" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# ─────────────────────────────────────────────────
# SNS: notificación al buzón real (confirmar
# suscripción desde el mail que manda AWS)
# ─────────────────────────────────────────────────

resource "aws_sns_topic" "inbound_mail" {
  name = "${var.app_name}-inbound-mail"
}

resource "aws_sns_topic_policy" "inbound_mail" {
  arn = aws_sns_topic.inbound_mail.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ses.amazonaws.com" }
        Action    = "sns:Publish"
        Resource  = aws_sns_topic.inbound_mail.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "inbound_mail_email" {
  topic_arn = aws_sns_topic.inbound_mail.arn
  protocol  = "email"
  endpoint  = var.inbound_mail_forward_to
}