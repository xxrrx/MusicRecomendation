const prisma = require('../../shared/config/database');
const { getPresignedUrl } = require('../../shared/utils/s3.helper');
const { playCountQueue } = require('../../shared/utils/bull-queue');
const { createError } = require('../../shared/utils/response.helper');

// ─── Stream ───────────────────────────────────────────────────────────────────

async function getStreamUrl(songId) {
  const song = await prisma.song.findFirst({
    where: { id: songId, status: 'published' },
    select: { id: true, title: true, fileUrl: true },
  });

  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');
  if (!song.fileUrl) throw createError('Audio not available', 404, 'AUDIO_NOT_FOUND');

  // fileUrl may be stored as a full S3 URL or just the key (e.g. "songs/xxx.mp3")
  let s3Key = song.fileUrl;
  try {
    const parsed = new URL(song.fileUrl);
    // Remove leading slash from pathname to get the S3 key
    s3Key = parsed.pathname.replace(/^\//, '');
  } catch {
    // Not a URL — already a plain key
  }
  const url = await getPresignedUrl(s3Key);
  return { songId: song.id, title: song.title, url };
}

// ─── Log play ─────────────────────────────────────────────────────────────────

async function logPlay(userId, { songId, durationPlayed, completionRate }) {
  const song = await prisma.song.findFirst({
    where: { id: songId, status: 'published' },
    select: { id: true },
  });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  await prisma.playHistory.create({
    data: {
      userId,
      songId,
      durationPlayed: Math.round(durationPlayed),
      completionRate: Math.min(1, Math.max(0, completionRate)),
    },
  });

  // Async — do not await
  playCountQueue.add({ songId });
}

// ─── Log behavior ──────────────────────────────────────────────────────────────

const VALID_ACTIONS = ['like', 'dislike', 'skip'];

async function logBehavior(userId, { songId, action }) {
  if (!VALID_ACTIONS.includes(action)) {
    throw createError(`action must be one of: ${VALID_ACTIONS.join(', ')}`, 422, 'VALIDATION_ERROR');
  }

  const song = await prisma.song.findFirst({
    where: { id: songId, status: 'published' },
    select: { id: true },
  });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  await prisma.userBehavior.upsert({
    where: { userId_songId: { userId, songId } },
    update: { action },
    create: { userId, songId, action },
  });
}

module.exports = { getStreamUrl, logPlay, logBehavior };
