terraform {
  backend "s3" {
    bucket = "terraform.jun.codes"
    key    = "jun.codes/blog-kickstarting-rust-on-aws-lambda-with-axum.tfstate"
    region = "eu-north-1"
  }

  required_version = "~> 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.52"
    }
  }
}

provider "aws" {
  region = "eu-north-1"

  default_tags {
    tags = {
      Project     = "jun.codes/blog-kickstarting-rust-on-aws-lambda-with-axum"
      Deployment  = "terraform"
      Environment = "prod"
      Source      = "github:junlarsen/jun.codes"
    }
  }
}
