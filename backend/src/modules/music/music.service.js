const prisma = require('../../shared/config/database');
const redis = require('../../shared/config/redis');
const { createError } = require('../../shared/utils/response.helper');

const CACHE_TTL = 3600; // 1 hour in seconds

// ─── Shared selects ──────────────────────────────────────────────────────────

const songSelect = {
  id: true,
  title: true,
  duration: true,
  bpm: true,
  mood: true,
  key: true,
  year: true,
  coverUrl: true,
  playCount: true,
  status: true,
  artist: { select: { id: true, user: { select: { displayName: true, avatarUrl: true } } } },
  album: { select: { id: true, title: true, coverUrl: true } },
  genre: { select: { id: true, name: true, slug: true } },
};

function formatSong(song) {
  if (!song) return null;
  return {
    id: song.id,
    title: song.title,
    duration: song.duration,
    bpm: song.bpm,
    mood: song.mood,
    key: song.key,
    year: song.year,
    coverUrl: song.coverUrl,
    playCount: song.playCount,
    status: song.status,
    artist: song.artist
      ? { id: song.artist.id, displayName: song.artist.user.displayName, avatarUrl: song.artist.user.avatarUrl }
      : null,
    album: song.album || null,
    genre: song.genre || null,
  };
}

// ─── Song detail ─────────────────────────────────────────────────────────────

async function getSongById(id) {
  const cacheKey = `song:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const song = await prisma.song.findFirst({
    where: { id, status: 'published' },
    select: songSelect,
  });

  if (!song) throw createError('Song not found', 404, 'NOT_FOUND');

  const result = formatSong(song);
  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

// ─── Song list ───────────────────────────────────────────────────────────────

async function getSongs({ page = 1, limit = 20, genreId, artistId } = {}) {
  const take = Math.min(Number(limit), 50);
  const skip = (Number(page) - 1) * take;

  const where = { status: 'published' };
  if (genreId) where.genreId = genreId;
  if (artistId) where.artistId = artistId;

  const [songs, total] = await Promise.all([
    prisma.song.findMany({ where, select: songSelect, orderBy: { playCount: 'desc' }, skip, take }),
    prisma.song.count({ where }),
  ]);

  return {
    songs: songs.map(formatSong),
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  };
}

// ─── Album detail ─────────────────────────────────────────────────────────────

async function getAlbumById(id) {
  const cacheKey = `album:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const album = await prisma.album.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      year: true,
      artist: { select: { id: true, user: { select: { displayName: true, avatarUrl: true } } } },
      songs: {
        where: { status: 'published' },
        select: songSelect,
        orderBy: { title: 'asc' },
      },
    },
  });

  if (!album) throw createError('Album not found', 404, 'NOT_FOUND');

  const result = {
    id: album.id,
    title: album.title,
    coverUrl: album.coverUrl,
    year: album.year,
    artist: {
      id: album.artist.id,
      displayName: album.artist.user.displayName,
      avatarUrl: album.artist.user.avatarUrl,
    },
    songs: album.songs.map(formatSong),
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

// ─── Artist detail ────────────────────────────────────────────────────────────

async function getArtistById(id) {
  const cacheKey = `artist:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [artist, playCountAgg] = await Promise.all([
    prisma.artist.findUnique({
      where: { id },
      select: {
        id: true,
        bio: true,
        user: { select: { displayName: true, avatarUrl: true } },
        _count: { select: { followers: true } },
        songs: {
          where: { status: 'published' },
          select: songSelect,
          orderBy: { playCount: 'desc' },
          take: 10,
        },
        albums: {
          select: { id: true, title: true, coverUrl: true, year: true },
          orderBy: { year: 'desc' },
        },
      },
    }),
    prisma.song.aggregate({
      where: { artistId: id, status: 'published' },
      _sum: { playCount: true },
    }),
  ]);

  if (!artist) throw createError('Artist not found', 404, 'NOT_FOUND');

  const totalPlayCount = playCountAgg._sum.playCount || 0;

  const result = {
    id: artist.id,
    displayName: artist.user.displayName,
    avatarUrl: artist.user.avatarUrl,
    bio: artist.bio,
    totalPlayCount,
    followerCount: artist._count.followers,
    songs: artist.songs.map(formatSong),
    albums: artist.albums,
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

module.exports = { getSongById, getSongs, getAlbumById, getArtistById };
