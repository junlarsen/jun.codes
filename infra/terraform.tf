terraform {
  backend "s3" {
    bucket = "junstack"
    key    = "website"
    region = "eu-north-1"
  }

  required_version = "~> 1.9.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.51"
    }

    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.11"
    }
  }
}

provider "aws" {
  region = "eu-north-1"

  default_tags {
    tags = {
      Project     = "website"
      Deployment  = "terraform"
      Environment = "prod"
    }
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "website"
      Deployment  = "terraform"
      Environment = "prod"
    }
  }
}

provider "vercel" {}
