terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "musicrecommendation.ptit.online"
    key    = "terraform-state/shared.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}
