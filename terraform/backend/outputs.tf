output "api_url" {
  value = "https://${var.api_domain}"
}

output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "rds_endpoint" {
  value     = aws_db_instance.postgres.endpoint
  sensitive = true
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}
