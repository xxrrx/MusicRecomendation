const prisma = require('../../shared/config/database');
const redis = require('../../shared/config/redis');
const { createError } = require('../../shared/utils/response.helper');
const { resolveS3Url } = require('../../shared/utils/s3.helper');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai_service:8000';
const CACHE_TTL = 900; // 15 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function enrichSongs(songIds) {
  if (!songIds || songIds.length === 0) return [];

  const songs = await prisma.song.findMany({
    where: { id: { in: songIds }, status: 'published' },
    select: {
      id: true,
      title: true,
      duration: true,
      coverUrl: true,
      playCount: true,
      artist: { select: { id: true, user: { select: { displayName: true, avatarUrl: true } } } },
      genre: { select: { id: true, name: true } },
    },
  });

  // Maintain order from AI response
  const songMap = Object.fromEntries(songs.map((s) => [s.id, s]));
  return songIds
    .filter((id) => songMap[id])
    .map((id) => {
      const s = songMap[id];
      return {
        id: s.id,
        title: s.title,
        duration: s.duration,
        coverUrl: resolveS3Url(s.coverUrl),
        playCount: s.playCount,
        artist: s.artist
          ? { id: s.artist.id, displayName: s.artist.user.displayName, avatarUrl: resolveS3Url(s.artist.user.avatarUrl) }
          : null,
        genre: s.genre,
      };
    });
}

async function getTopChartSongs(limit = 20) {
  const songs = await prisma.song.findMany({
    where: { status: 'published' },
    orderBy: { playCount: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      duration: true,
      coverUrl: true,
      playCount: true,
      artist: { select: { id: true, user: { select: { displayName: true, avatarUrl: true } } } },
      genre: { select: { id: true, name: true } },
    },
  });
  return songs.map((s) => ({
    id: s.id,
    title: s.title,
    duration: s.duration,
    coverUrl: resolveS3Url(s.coverUrl),
    playCount: s.playCount,
    artist: s.artist
      ? { id: s.artist.id, displayName: s.artist.user.displayName, avatarUrl: resolveS3Url(s.artist.user.avatarUrl) }
      : null,
    genre: s.genre,
  }));
}

// ─── Recommend ────────────────────────────────────────────────────────────────

async function getRecommendations(userId) {
  const cacheKey = `recommendations:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  let songIds;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${AI_SERVICE_URL}/recommend?user_id=${encodeURIComponent(userId)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = await res.json();
    songIds = data.song_ids || [];
  } catch (err) {
    console.error(`[recommend] AI service unreachable, falling back to top charts: ${err.message}`);
    const fallback = await getTopChartSongs(20);
    await redis.setex(cacheKey, 60, JSON.stringify(fallback)); // cache fallback chỉ 1 phút
    return fallback;
  }

  const enriched = await enrichSongs(songIds);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(enriched));
  return enriched;
}

// ─── Radio ────────────────────────────────────────────────────────────────────

async function getRadio(songId) {
  const cacheKey = `radio:${songId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Validate song exists
  const song = await prisma.song.findFirst({
    where: { id: songId, status: 'published' },
    select: { id: true },
  });
  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  let songIds;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${AI_SERVICE_URL}/radio?song_id=${encodeURIComponent(songId)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = await res.json();
    songIds = data.song_ids || [];
  } catch (err) {
    console.error(`[radio] AI service unreachable, falling back to top charts: ${err.message}`);
    const fallback = await getTopChartSongs(20);
    await redis.setex(cacheKey, 60, JSON.stringify(fallback));
    return fallback;
  }

  const enriched = await enrichSongs(songIds);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(enriched));
  return enriched;
}

// ─── Cache invalidation ───────────────────────────────────────────────────────

async function invalidateUserCache(userId) {
  await redis.del(`recommendations:${userId}`);
}

module.exports = { getRecommendations, getRadio, invalidateUserCache };
