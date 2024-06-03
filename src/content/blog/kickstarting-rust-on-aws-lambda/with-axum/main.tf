data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execute_role" {
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  name               = "kickstarting-rust-on-aws-lambda-with-axum-execute-role"
}

resource "aws_iam_role_policy_attachment" "lambda_execute" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execute_role.name
}

data "archive_file" "bootstrap" {
  type        = "zip"
  source_dir  = "target/lambda/with-axum"
  output_path = "dist/with-axum.zip"
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = 7
}

resource "aws_lambda_function" "this" {
  function_name = "kickstarting-rust-on-aws-lambda-with-axum"
  role          = aws_iam_role.lambda_execute_role.arn

  filename         = data.archive_file.bootstrap.output_path
  source_code_hash = data.archive_file.bootstrap.output_base64sha256

  runtime     = "provided.al2023"
  handler     = "bootstrap"
  timeout     = 10
  memory_size = 256

  environment {
    variables = {
      RUST_BACKTRACE        = "1",
      RUST_LOG              = "trace",
      AWS_LAMBDA_LOG_FORMAT = "json",
      AWS_LAMBDA_LOG_LEVEL  = "trace"
    }
  }
}

resource "aws_lambda_function_url" "this" {
  function_name      = aws_lambda_function.this.function_name
  authorization_type = "NONE"
}


data "aws_iam_policy_document" "execution" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunctionUrl"]
    resources = [aws_lambda_function.this.invoke_arn]
  }
}

resource "aws_iam_policy" "public_invoke" {
  policy = data.aws_iam_policy_document.execution.json
  name   = "kickstarting-rust-on-aws-lambda-with-axum-execute-policy"
}

resource "aws_iam_role_policy_attachment" "public_invoke" {
  policy_arn = aws_iam_policy.public_invoke.arn
  role       = aws_iam_role.lambda_execute_role.name
}

output "url" {
  value = aws_lambda_function_url.this.function_url
}
