resource "aws_db_subnet_group" "main" {
  name       = "music-db-subnet-group"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

resource "aws_db_instance" "postgres" {
  identifier        = "music-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "musicdb"
  username = "musicuser"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Không snapshot khi destroy - dùng pg_dump lên S3 thay thế
  skip_final_snapshot = true
  deletion_protection = false

  tags = { Name = "music-db" }
}
