#!/bin/bash
set -e

REGION="us-east-1"
BACKUP_BUCKET="musicrecommendation.ptit.online"
BACKUP_FILE=$1  # Tên file backup, ví dụ: backup_20260424_120000.sql

echo "======================================"
echo " MUSIC APP - START BACKEND"
echo "======================================"

# Nếu không truyền backup file, list các backup có sẵn
if [ -z "$BACKUP_FILE" ]; then
  echo "Danh sach backup co san:"
  aws s3 ls "s3://$BACKUP_BUCKET/db-backups/" --region $REGION | sort -r | head -10
  echo ""
  echo "Usage: ./scripts/start.sh <backup_file>"
  echo "Hoac de trong de khoi dong voi DB trong: ./scripts/start.sh"
  echo ""
  read -p "Nhap ten file backup (Enter de bo qua): " BACKUP_FILE
fi

echo "[1/4] Terraform apply backend..."
cd "$(dirname "$0")/../terraform/backend"
terraform apply -auto-approve
DB_ENDPOINT=$(terraform output -raw rds_endpoint)
DB_HOST=$(echo $DB_ENDPOINT | cut -d: -f1)
cd "$(dirname "$0")/.."

echo "[2/4] Doi RDS san sang (60 giay)..."
sleep 60

echo "[3/4] Update secrets sau apply..."
echo "  DATABASE_URL da duoc Terraform tu dong cap nhat."
echo "  Kiem tra cac secret can thiet:"
echo "    - /music/JWT_SECRET"
echo "    - /music/AWS_ACCESS_KEY_ID"
echo "    - /music/AWS_SECRET_ACCESS_KEY"
echo "    - /music/SES_FROM_EMAIL"
echo ""

if [ -n "$BACKUP_FILE" ]; then
  echo "[4/4] Restore database tu backup: $BACKUP_FILE ..."

  DB_PASSWORD=$(aws ssm get-parameter \
    --name /music/DB_PASSWORD \
    --with-decryption \
    --query Parameter.Value \
    --output text \
    --region $REGION)

  aws s3 cp "s3://$BACKUP_BUCKET/db-backups/$BACKUP_FILE" "/tmp/$BACKUP_FILE" --region $REGION

  PGPASSWORD=$DB_PASSWORD psql \
    -h "$DB_HOST" \
    -U musicuser \
    -d musicdb \
    -f "/tmp/$BACKUP_FILE"

  rm "/tmp/$BACKUP_FILE"
  echo "  Database restored tu: $BACKUP_FILE"
else
  echo "[4/4] Khong co backup - ECS backend se tu chay Prisma migrate khi start."
fi

echo ""
echo "======================================"
echo " DONE! Backend dang chay."
echo " API:      https://api.ptit.online"
echo " Frontend: https://musicrecommendation.ptit.online"
echo "======================================"
