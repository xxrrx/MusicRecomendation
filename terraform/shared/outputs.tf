output "backend_ecr_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ai_service_ecr_url" {
  value = aws_ecr_repository.ai_service.repository_url
}
