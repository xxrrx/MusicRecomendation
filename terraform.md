# Terraform Deployment Guide

## Yêu cầu

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) đã configured (`aws configure`)
- [Docker](https://docs.docker.com/get-docker/) đang chạy
- `pg_dump` / `psql` đã cài (dùng khi destroy/restore)
- Node.js 20 (để build frontend)

---

## Thông tin cấu hình

| | |
|---|---|
| **Region** | `us-east-1` |
| **Frontend URL** | `https://musicrecommendation.ptit.online` |
| **API URL** | `https://api.ptit.online` |
| **S3 nhạc** | `music-streaming-files-s3-469164977878-us-east-1-an` |
| **S3 state + backup** | `musicrecommendation.ptit.online` |
| **AWS Account ID** | `469164977878` |

---

## Lần đầu deploy (toàn bộ)

### Bước 1 — Tạo ECR repositories

```bash
cd terraform/shared
terraform init
terraform apply
```

Sau khi xong, lấy ECR URLs:
```bash
terraform output
```

### Bước 2 — Build và push Docker images lên ECR

```bash
# Login ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 469164977878.dkr.ecr.us-east-1.amazonaws.com

# Build & push backend
docker build -t music-backend ./backend
docker tag music-backend:latest 469164977878.dkr.ecr.us-east-1.amazonaws.com/music-backend:latest
docker push 469164977878.dkr.ecr.us-east-1.amazonaws.com/music-backend:latest

# Build & push ai_service
docker build -t music-ai-service ./ai_service
docker tag music-ai-service:latest 469164977878.dkr.ecr.us-east-1.amazonaws.com/music-ai-service:latest
docker push 469164977878.dkr.ecr.us-east-1.amazonaws.com/music-ai-service:latest
```

### Bước 3 — Deploy Frontend infrastructure (permanent)

```bash
cd terraform/frontend
terraform init
terraform apply
```

> Bước này tạo S3 bucket, CloudFront, ACM certificate, và Route53 record.
> ACM certificate validation có thể mất 2–5 phút.

### Bước 4 — Deploy Backend infrastructure (destroyable)

```bash
# Tạo file tfvars từ example
cp terraform/backend/terraform.tfvars.example terraform/backend/terraform.tfvars

# Sửa file, điền mật khẩu DB
# db_password = "YourStrongPasswordHere123!"

cd terraform/backend
terraform init
terraform apply
```

> Bước này tạo VPC, ALB, ECS cluster, RDS, SSM parameters, và Route53 record.
> Mất khoảng 10–15 phút (chủ yếu là RDS).

### Bước 5 — Điền secrets vào SSM Parameter Store

Sau khi `terraform apply` xong, vào AWS Console → Systems Manager → Parameter Store,
hoặc dùng CLI để update các giá trị `CHANGE_ME_AFTER_APPLY`:

```bash
# JWT Secret (tạo random string)
aws ssm put-parameter --name /music/JWT_SECRET \
  --value "your-super-secret-jwt-key-here" \
  --type SecureString --overwrite --region us-east-1

# AWS credentials cho S3/SES (IAM user có quyền S3 + SES)
aws ssm put-parameter --name /music/AWS_ACCESS_KEY_ID \
  --value "AKIAIOSFODNN7EXAMPLE" \
  --type SecureString --overwrite --region us-east-1

aws ssm put-parameter --name /music/AWS_SECRET_ACCESS_KEY \
  --value "your-secret-access-key" \
  --type SecureString --overwrite --region us-east-1

# Email gửi từ SES (đã verify trong SES)
aws ssm put-parameter --name /music/SES_FROM_EMAIL \
  --value "noreply@ptit.online" \
  --type String --overwrite --region us-east-1
```

### Bước 6 — Deploy Frontend lên S3

```bash
chmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh
```

### Bước 7 — Restart ECS tasks để nhận secrets mới

```bash
aws ecs update-service --cluster music-cluster \
  --service music-backend --force-new-deployment --region us-east-1

aws ecs update-service --cluster music-cluster \
  --service music-ai-service --force-new-deployment --region us-east-1
```

---

## Khi không dùng — Destroy backend

```bash
chmod +x scripts/destroy.sh
./scripts/destroy.sh
```

Script sẽ tự động:
1. Dump toàn bộ database → upload lên S3 (`musicrecommendation.ptit.online/db-backups/`)
2. Chạy `terraform destroy` xóa toàn bộ backend

> Frontend (S3 + CloudFront + Route53) vẫn còn nguyên.
> Chi phí còn lại: ~$2/tháng.

---

## Khi muốn dùng lại — Start backend

```bash
chmod +x scripts/start.sh

# Với restore database từ backup
./scripts/start.sh backup_20260424_120000.sql

# Hoặc không restore (DB trống, chạy migration mới)
./scripts/start.sh
```

Script sẽ tự động:
1. `terraform apply` tạo lại toàn bộ backend (~10–15 phút)
2. Restore database từ file backup trên S3

---

## Khi update code — Redeploy

### Update backend hoặc ai_service

```bash
# Login ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 469164977878.dkr.ecr.us-east-1.amazonaws.com

# Build và push image mới
docker build -t music-backend ./backend
docker tag music-backend:latest 469164977878.dkr.ecr.us-east-1.amazonaws.com/music-backend:latest
docker push 469164977878.dkr.ecr.us-east-1.amazonaws.com/music-backend:latest

# Force ECS deploy image mới
aws ecs update-service --cluster music-cluster \
  --service music-backend --force-new-deployment --region us-east-1
```

### Update frontend

```bash
./scripts/deploy-frontend.sh
```

---

## Xem logs

```bash
# Logs backend
aws logs tail /ecs/music --filter-pattern "[backend]" --follow --region us-east-1

# Logs ai_service
aws logs tail /ecs/music --filter-pattern "[ai-service]" --follow --region us-east-1

# Logs redis
aws logs tail /ecs/music --filter-pattern "[redis]" --follow --region us-east-1
```

---

## Troubleshooting

### ECS task không start được
```bash
# Xem events của service
aws ecs describe-services \
  --cluster music-cluster \
  --services music-backend \
  --region us-east-1 \
  --query "services[0].events[:5]"
```

### Database không connect được
- Kiểm tra Security Group `music-rds-sg` có cho phép port 5432 từ `music-backend-sg` không
- Kiểm tra SSM parameter `/music/DATABASE_URL` đúng endpoint chưa:
```bash
aws ssm get-parameter --name /music/DATABASE_URL \
  --with-decryption --query Parameter.Value --output text --region us-east-1
```

### CloudFront vẫn hiện trang cũ
```bash
# Invalidate thủ công
DIST_ID=$(cd terraform/frontend && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## Chi phí ước tính

| Trạng thái | Chi phí |
|---|---|
| **Backend đang chạy** | ~$0.065/giờ (~$47/tháng nếu 24/7) |
| **Chạy 4 giờ/ngày** | ~$8/tháng |
| **Backend đã destroy** | ~$2/tháng (S3 + CloudFront + Route53) |
