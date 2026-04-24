const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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

/**
 * Upload a file buffer to S3.
 * @param {string} key — S3 object key
 * @param {Buffer} buffer — file contents
 * @param {string} contentType — MIME type
 * @returns {Promise<string>} the key that was stored
 */
async function uploadToS3(key, buffer, contentType) {
  if (!env.AWS_S3_BUCKET) {
    // Dev fallback: pretend upload succeeded
    return key;
  }
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await getS3Client().send(command);
  return key;
}

/**
 * Delete an object from S3 (best-effort — does not throw on missing key).
 * @param {string} key — S3 object key
 */
async function deleteFromS3(key) {
  if (!env.AWS_S3_BUCKET) return;
  const command = new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key });
  await getS3Client().send(command);
}

/**
 * Resolve a coverUrl/avatarUrl value to a full public S3 URL.
 * If already a full URL, return as-is. If a plain key, build the public URL.
 * @param {string|null} urlOrKey
 * @returns {string|null}
 */
function resolveS3Url(urlOrKey) {
  if (!urlOrKey) return null;
  try {
    new URL(urlOrKey);
    return urlOrKey; // already a full URL
  } catch {
    if (!env.AWS_S3_BUCKET) return `http://localhost:9000/${urlOrKey}`;
    return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${urlOrKey}`;
  }
}

module.exports = { getPresignedUrl, uploadToS3, deleteFromS3, resolveS3Url };
