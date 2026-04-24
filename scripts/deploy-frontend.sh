#!/bin/bash
set -e

REGION="us-east-1"
S3_BUCKET="musicrecommendation.ptit.online"
S3_PREFIX=""   # để trống vì frontend nằm ở root bucket
API_URL="https://api.ptit.online/api"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "======================================"
echo " MUSIC APP - DEPLOY FRONTEND"
echo "======================================"

echo "[1/4] Build React app..."
cd "$ROOT_DIR/frontend"
VITE_API_URL="$API_URL" npm run build

echo "[2/4] Upload len S3..."
# Chỉ sync assets (có hash, cache lâu), KHÔNG --delete để tránh xóa terraform-state/
aws s3 sync dist/assets "s3://$S3_BUCKET/assets" \
  --region $REGION \
  --cache-control "public, max-age=31536000, immutable"

# index.html không cache
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --region $REGION \
  --cache-control "no-cache, no-store, must-revalidate"

echo "[3/4] Lay CloudFront distribution ID..."
DISTRIBUTION_ID=$(cd "$ROOT_DIR/terraform/frontend" && terraform output -raw cloudfront_distribution_id)

echo "[4/4] Invalidate CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo ""
echo "======================================"
echo " DONE! Frontend deployed."
echo " URL: https://$S3_BUCKET"
echo " (CloudFront cache invalidation ~30 giay)"
echo "======================================"
