# DATABASE_URL tự động tạo từ RDS endpoint sau khi apply
resource "aws_ssm_parameter" "database_url" {
  name  = "/music/DATABASE_URL"
  type  = "SecureString"
  value = "postgresql://musicuser:${var.db_password}@${aws_db_instance.postgres.endpoint}/musicdb"
}

# Dùng trong scripts/destroy.sh và scripts/start.sh để pg_dump/restore
resource "aws_ssm_parameter" "db_password" {
  name  = "/music/DB_PASSWORD"
  type  = "SecureString"
  value = var.db_password
}

resource "aws_ssm_parameter" "aws_access_key" {
  name  = "/music/AWS_ACCESS_KEY_ID"
  type  = "SecureString"
  value = var.aws_access_key_id
}

resource "aws_ssm_parameter" "aws_secret_key" {
  name  = "/music/AWS_SECRET_ACCESS_KEY"
  type  = "SecureString"
  value = var.aws_secret_access_key
}
