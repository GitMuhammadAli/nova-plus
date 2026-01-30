# Terraform Configuration for Phase 7 Microservices
# AWS Infrastructure as Code

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

# SQS Queues
resource "aws_sqs_queue" "events_queue" {
  name                      = "novapulse-events-${var.environment}"
  message_retention_seconds = 345600 # 4 days
  visibility_timeout_seconds = 300

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.events_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "events_dlq" {
  name                      = "novapulse-events-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days
}

# API Gateway (stub - full config would be more complex)
resource "aws_apigatewayv2_api" "main" {
  name          = "novapulse-api-${var.environment}"
  protocol_type = "HTTP"
  description   = "NovaPulse API Gateway for microservices"
}

# Outputs
output "sqs_queue_url" {
  value = aws_sqs_queue.events_queue.url
}

output "sqs_dlq_url" {
  value = aws_sqs_queue.events_dlq.url
}

output "api_gateway_url" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

