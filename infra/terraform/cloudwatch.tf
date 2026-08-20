# ─────────────────────────────────────────────────
# CloudWatch Log Groups (7-day retention)
# ─────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api" {
  name              = "/quiero-menu/api"
  retention_in_days = 7

  tags = {
    Name = "${var.app_name}-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "ui" {
  name              = "/quiero-menu/ui"
  retention_in_days = 7

  tags = {
    Name = "${var.app_name}-ui-logs"
  }
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/quiero-menu/nginx"
  retention_in_days = 7

  tags = {
    Name = "${var.app_name}-nginx-logs"
  }
}

# ─────────────────────────────────────────────────
# SNS topic for alarms
# ─────────────────────────────────────────────────

resource "aws_sns_topic" "alerts" {
  name = "${var.app_name}-alerts"

  tags = {
    Name = "${var.app_name}-alerts"
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alerts_email
}

# ─────────────────────────────────────────────────
# Metric filters
# ─────────────────────────────────────────────────

# Any ERROR token in API logs (NestJS logs "ERROR [ExceptionsHandler] ...")
resource "aws_cloudwatch_log_metric_filter" "api_errors" {
  name           = "${var.app_name}-api-errors"
  pattern        = "ERROR"
  log_group_name = aws_cloudwatch_log_group.api.name

  metric_transformation {
    name          = "ApiErrors"
    namespace     = "${var.app_name}/Api"
    value         = "1"
    default_value = "0"
  }
}

# nginx default combined log format:
#   ip id user [timestamp] "request" status bytes "referer" "agent"
resource "aws_cloudwatch_log_metric_filter" "nginx_5xx" {
  name           = "${var.app_name}-nginx-5xx"
  pattern        = "[ip, id, user, timestamp, request, status = 5*, bytes, referer, agent]"
  log_group_name = aws_cloudwatch_log_group.nginx.name

  metric_transformation {
    name          = "Nginx5xx"
    namespace     = "${var.app_name}/Nginx"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "nginx_4xx" {
  name           = "${var.app_name}-nginx-4xx"
  pattern        = "[ip, id, user, timestamp, request, status = 4*, bytes, referer, agent]"
  log_group_name = aws_cloudwatch_log_group.nginx.name

  metric_transformation {
    name          = "Nginx4xx"
    namespace     = "${var.app_name}/Nginx"
    value         = "1"
    default_value = "0"
  }
}

# ─────────────────────────────────────────────────
# Alarms
# ─────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "ec2_system_status" {
  alarm_name          = "${var.app_name}-ec2-system-status"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "StatusCheckFailed_System"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "1"
  alarm_description   = "EC2 system status check failed (hardware/network problem)."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_instance_status" {
  alarm_name          = "${var.app_name}-ec2-instance-status"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "StatusCheckFailed_Instance"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "1"
  alarm_description   = "EC2 instance status check failed (OS/runtime problem)."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.app_name}-api-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "5"
  metric_name         = "ApiErrors"
  namespace           = "${var.app_name}/Api"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "More than 5 ERROR log lines in the API in 5 minutes."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "nginx_5xx" {
  alarm_name          = "${var.app_name}-nginx-5xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "5"
  metric_name         = "Nginx5xx"
  namespace           = "${var.app_name}/Nginx"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "More than 10 HTTP 5xx responses in 5 minutes."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "nginx_4xx" {
  alarm_name          = "${var.app_name}-nginx-4xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "5"
  metric_name         = "Nginx4xx"
  namespace           = "${var.app_name}/Nginx"
  period              = "60"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "More than 50 HTTP 4xx responses in 5 minutes (possible attack or bad config)."
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}