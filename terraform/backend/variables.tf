variable "api_domain" {
  default = "api.ptit.online"
}

variable "hosted_zone_id" {
  default = "Z01999171UAAHYK3BP7AS"
}

variable "account_id" {
  default = "469164977878"
}

variable "region" {
  default = "us-east-1"
}

variable "db_password" {
  description = "RDS master password"
  sensitive   = true
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID for SSM"
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key for SSM"
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  sensitive   = true
}
