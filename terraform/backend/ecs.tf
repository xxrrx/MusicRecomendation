# CloudWatch log group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/music"
  retention_in_days = 7
}

# IAM: ECS Task Execution Role (pull image, đọc SSM, ghi logs)
resource "aws_iam_role" "ecs_task_execution" {
  name = "music-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ssm_read" {
  name = "ssm-read"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameters", "ssm:GetParameter"]
      Resource = "arn:aws:ssm:us-east-1:${var.account_id}:parameter/music/*"
    }]
  })
}

# IAM: ECS Task Role (runtime - truy cập S3)
resource "aws_iam_role" "ecs_task" {
  name = "music-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "s3-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
      Resource = "arn:aws:s3:::music-streaming-files-s3-469164977878-us-east-1-an/*"
    }]
  })
}

# Service Connect namespace (dùng để các tasks giao tiếp với nhau)
resource "aws_service_discovery_http_namespace" "music" {
  name = "music"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "music-cluster"

  service_connect_defaults {
    namespace = aws_service_discovery_http_namespace.music.arn
  }
}

# --- Redis Task ---
resource "aws_ecs_task_definition" "redis" {
  family                   = "music-redis"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "redis"
    image     = "redis:7-alpine"
    essential = true

    portMappings = [{
      name          = "redis"
      containerPort = 6379
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.ecs.name
        awslogs-region        = "us-east-1"
        awslogs-stream-prefix = "redis"
      }
    }
  }])
}

resource "aws_ecs_service" "redis" {
  name            = "music-redis"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.redis.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id]
    security_groups  = [aws_security_group.redis.id]
    assign_public_ip = true
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.music.arn

    service {
      port_name      = "redis"
      discovery_name = "redis"
      client_alias {
        port     = 6379
        dns_name = "redis"
      }
    }
  }
}

# --- AI Service Task ---
resource "aws_ecs_task_definition" "ai_service" {
  family                   = "music-ai-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "ai-service"
    image     = "${var.account_id}.dkr.ecr.${var.region}.amazonaws.com/music-ai-service:latest"
    essential = true

    portMappings = [{
      name          = "ai-service"
      containerPort = 8000
      protocol      = "tcp"
    }]

    secrets = [
      { name = "DATABASE_URL", valueFrom = "/music/DATABASE_URL" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.ecs.name
        awslogs-region        = "us-east-1"
        awslogs-stream-prefix = "ai-service"
      }
    }
  }])
}

resource "aws_ecs_service" "ai_service" {
  name            = "music-ai-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.ai_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id]
    security_groups  = [aws_security_group.ai_service.id]
    assign_public_ip = true
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.music.arn

    service {
      port_name      = "ai-service"
      discovery_name = "ai-service"
      client_alias {
        port     = 8000
        dns_name = "ai-service"
      }
    }
  }
}

# --- Backend Task ---
resource "aws_ecs_task_definition" "backend" {
  family                   = "music-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${var.account_id}.dkr.ecr.${var.region}.amazonaws.com/music-backend:latest"
    essential = true

    portMappings = [{
      name          = "backend"
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV",              value = "production" },
      { name = "PORT",                  value = "8080" },
      { name = "AI_SERVICE_URL",        value = "http://ai-service:8000" },
      { name = "REDIS_URL",             value = "redis://redis:6379" },
      { name = "JWT_SECRET",            value = "dev_jwt_secret_change_in_production_32chars" },
      { name = "JWT_REFRESH_SECRET",    value = "dev_jwt_refresh_secret_change_in_production_32chars" },
      { name = "JWT_EXPIRES_IN",        value = "15m" },
      { name = "JWT_REFRESH_EXPIRES_IN",value = "7d" },
      { name = "AWS_REGION",            value = "us-east-1" },
      { name = "AWS_S3_BUCKET",         value = "music-streaming-files-s3-469164977878-us-east-1-an" },
      { name = "STRIPE_SECRET_KEY",     value = var.stripe_secret_key },
      { name = "STRIPE_PUBLISHABLE_KEY",value = "pk_test_51TPTCvFCSCfDri6wAtNGQPgSUBwLbywLZOBeAyHOoncWSpQZ8TzehkAeAibSmiPM7qmJ9A9a7rVE4P83XQV90iG000V2kqyMoR" },
      { name = "VNP_TMN_CODE",          value = "7XDCYLOG" },
      { name = "VNP_SECURE_SECRET",     value = "PIX38EMZDY5GP61KKBS182T7768ZXXYB" },
      { name = "VNP_HOST",              value = "https://sandbox.vnpayment.vn" },
      { name = "FRONTEND_URL",          value = "https://musicrecommendation.ptit.online" },
      { name = "BACKEND_URL",           value = "https://api.ptit.online/api" },
      { name = "BREVO_USER",            value = "9e8edc001@smtp-brevo.com" },
      { name = "BREVO_PASS",            value = "bskFKJZGqkVSDZP" },
      { name = "BREVO_SENDER",          value = "hellothuan12112004@gmail.com" }
    ]

    secrets = [
      { name = "DATABASE_URL",          valueFrom = "/music/DATABASE_URL" },
      { name = "AWS_ACCESS_KEY_ID",     valueFrom = "/music/AWS_ACCESS_KEY_ID" },
      { name = "AWS_SECRET_ACCESS_KEY", valueFrom = "/music/AWS_SECRET_ACCESS_KEY" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.ecs.name
        awslogs-region        = "us-east-1"
        awslogs-stream-prefix = "backend"
      }
    }
  }])
}

resource "aws_ecs_service" "backend" {
  name            = "music-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id]
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.music.arn
  }

  depends_on = [
    aws_lb_listener.https,
    aws_ecs_service.redis,
    aws_ecs_service.ai_service
  ]
}
