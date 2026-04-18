const prisma = require('../../shared/config/database');
const redis = require('../../shared/config/redis');
const { createError } = require('../../shared/utils/response.helper');

const CACHE_TTL = 3600; // 1 hour

const CHART_TYPES = ['daily', 'weekly', 'monthly'];

// System playlist titles for each chart type
const CHART_TITLES = {
  daily: 'Daily Top 50',
  weekly: 'Weekly Top 50',
  monthly: 'Monthly Top 50',
};

// How far back to look for plays
function getDateThreshold(type) {
  const now = new Date();
  if (type === 'daily') {
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (type === 'weekly') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  // monthly
  now.setDate(now.getDate() - 30);
  return now;
}

const songSelect = {
  id: true,
  title: true,
  duration: true,
  coverUrl: true,
  playCount: true,
  artist: { select: { id: true, user: { select: { displayName: true, avatarUrl: true } } } },
  album: { select: { id: true, title: true } },
  genre: { select: { id: true, name: true } },
};

function formatSong(song) {
  return {
    id: song.id,
    title: song.title,
    duration: song.duration,
    coverUrl: song.coverUrl,
    playCount: song.playCount,
    artist: song.artist
      ? { id: song.artist.id, displayName: song.artist.user.displayName, avatarUrl: song.artist.user.avatarUrl }
      : null,
    album: song.album || null,
    genre: song.genre || null,
  };
}

/**
 * Get chart songs — served from Redis cache or recomputed from DB.
 */
async function getChart(type) {
  if (!CHART_TYPES.includes(type)) {
    throw createError(`Invalid chart type. Use: ${CHART_TYPES.join(', ')}`, 400, 'INVALID_CHART_TYPE');
  }

  const cacheKey = `chart:${type}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  return computeAndCacheChart(type);
}

/**
 * Compute top 50 songs for the given period, upsert into system playlist, cache result.
 */
async function computeAndCacheChart(type) {
  const since = getDateThreshold(type);

  // Aggregate play_history to find top 50 songs
  const topPlays = await prisma.playHistory.groupBy({
    by: ['songId'],
    where: { playedAt: { gte: since } },
    _count: { songId: true },
    orderBy: { _count: { songId: 'desc' } },
    take: 50,
  });

  // If not enough data, fall back to overall playCount
  let songIds = topPlays.map((r) => r.songId);
  if (songIds.length < 10) {
    const topSongs = await prisma.song.findMany({
      where: { status: 'published' },
      select: { id: true },
      orderBy: { playCount: 'desc' },
      take: 50,
    });
    songIds = topSongs.map((s) => s.id);
  }

  // Fetch full song details preserving order
  const songsRaw = await prisma.song.findMany({
    where: { id: { in: songIds }, status: 'published' },
    select: songSelect,
  });

  // Preserve ranked order
  const songMap = new Map(songsRaw.map((s) => [s.id, s]));
  const songs = songIds
    .map((id) => songMap.get(id))
    .filter(Boolean)
    .map(formatSong);

  const chartData = {
    type,
    title: CHART_TITLES[type],
    songs,
    computedAt: new Date().toISOString(),
  };

  await redis.set(`chart:${type}`, JSON.stringify(chartData), 'EX', CACHE_TTL);

  // Upsert system playlist in DB (background — no await needed for response)
  upsertSystemPlaylist(type, songs).catch((err) =>
    console.error(`[charts] Failed to upsert system playlist for ${type}:`, err.message)
  );

  return chartData;
}

async function upsertSystemPlaylist(type, songs) {
  const title = CHART_TITLES[type];
  let playlist = await prisma.playlist.findFirst({
    where: { isSystem: true, title },
  });

  if (!playlist) {
    playlist = await prisma.playlist.create({
      data: { title, isSystem: true, userId: null },
    });
  }

  // Replace all songs in this system playlist
  await prisma.playlistSong.deleteMany({ where: { playlistId: playlist.id } });
  if (songs.length > 0) {
    await prisma.playlistSong.createMany({
      data: songs.map((song, idx) => ({
        playlistId: playlist.id,
        songId: song.id,
        position: idx + 1,
      })),
    });
  }
}

module.exports = { getChart, computeAndCacheChart };
