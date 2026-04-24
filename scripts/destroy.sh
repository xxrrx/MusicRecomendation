#!/bin/bash
set -e

REGION="us-east-1"
BACKUP_BUCKET="musicrecommendation.ptit.online"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="backup_${TIMESTAMP}.sql"

echo "======================================"
echo " MUSIC APP - DESTROY BACKEND"
echo "======================================"

# Lấy DB info từ SSM
echo "[1/4] Lấy thông tin database từ SSM..."
DB_PASSWORD=$(aws ssm get-parameter \
  --name /music/DB_PASSWORD \
  --with-decryption \
  --query Parameter.Value \
  --output text \
  --region $REGION)

DB_ENDPOINT=$(cd "$(dirname "$0")/../terraform/backend" && terraform output -raw rds_endpoint)
DB_HOST=$(echo $DB_ENDPOINT | cut -d: -f1)

echo "[2/4] Dump database → $DUMP_FILE ..."
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h "$DB_HOST" \
  -U musicuser \
  -d musicdb \
  --no-owner \
  --no-acl \
  -f "/tmp/$DUMP_FILE"

echo "[3/4] Upload backup lên S3..."
aws s3 cp "/tmp/$DUMP_FILE" "s3://$BACKUP_BUCKET/db-backups/$DUMP_FILE" --region $REGION
rm "/tmp/$DUMP_FILE"

echo ""
echo "  Backup saved: s3://$BACKUP_BUCKET/db-backups/$DUMP_FILE"
echo ""

echo "[4/4] Terraform destroy backend..."
cd "$(dirname "$0")/../terraform/backend"
terraform destroy -auto-approve

echo ""
echo "======================================"
echo " DONE! Backend destroyed."
echo " Chi phi con lai: ~\$2/thang (S3 + CloudFront + Route53)"
echo ""
echo " De khoi dong lai:"
echo "   ./scripts/start.sh $DUMP_FILE"
echo "======================================"
