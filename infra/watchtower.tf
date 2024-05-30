data "aws_caller_identity" "current" {}

resource "aws_secretsmanager_secret" "watchtower_discord_webhook" {
  name = "website/prod/watchtower-discord-webhook"
}

data "aws_secretsmanager_secret_version" "watchtower_discord_webhook" {
  secret_id = aws_secretsmanager_secret.watchtower_discord_webhook.id
}

module "watchtower" {
  source = "github.com/junlarsen/watchtower"

  lambda_function_name       = "watchtower-prod"
  lambda_execution_role_name = "watchtower-prod-execution-role"
  lambda_execution_role_statements = [
    {
      effect     = "Allow"
      actions    = ["ce:GetCostAndUsage"]
      resources  = ["arn:aws:ce:us-east-1:${data.aws_caller_identity.current.account_id}:/GetCostAndUsage"]
      conditions = []
    }
  ]

  environment_variables = {
    RUST_LOG            = "trace"
    DISCORD_WEBHOOK_URL = data.aws_secretsmanager_secret_version.watchtower_discord_webhook.secret_string
  }

  cloudwatch_log_group_name       = "/aws/lambda/watchtower-prod"
  cloudwatch_log_retention_window = 7

  output_directory = "dist"
}