const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('../config/env');

let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
          : undefined,
      // Disable checksum — prevents x-amz-checksum-mode=ENABLED being added to
      // presigned URLs, which causes 403 when opened in browser / Postman
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return s3Client;
}

/**
 * Generate a presigned GET URL for an S3 object.
 * @param {string} key  — S3 object key (e.g. "audio/song-uuid.mp3")
 * @param {number} expiresIn — seconds until expiry (default 3600)
 * @returns {Promise<string>} presigned URL
 */
async function getPresignedUrl(key, expiresIn = 3600) {
  if (!env.AWS_S3_BUCKET) {
    // Dev fallback: return a placeholder so the app doesn't crash without AWS creds
    return `http://localhost:9000/${key}`;
  }

  const command = new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

module.exports = { getPresignedUrl };
