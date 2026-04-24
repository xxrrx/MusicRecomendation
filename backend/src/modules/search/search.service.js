const prisma = require('../../shared/config/database');
const redis = require('../../shared/config/redis');
const { resolveS3Url } = require('../../shared/utils/s3.helper');

const CACHE_TTL = 1800; // 30 minutes

const songSelect = {
  id: true,
  title: true,
  duration: true,
  coverUrl: true,
  playCount: true,
  status: true,
  artist: { select: { id: true, user: { select: { displayName: true, avatarUrl: true } } } },
  album: { select: { id: true, title: true } },
  genre: { select: { id: true, name: true } },
};

function formatSong(song) {
  return {
    id: song.id,
    title: song.title,
    duration: song.duration,
    coverUrl: resolveS3Url(song.coverUrl),
    playCount: song.playCount,
    artist: song.artist
      ? { id: song.artist.id, displayName: song.artist.user.displayName, avatarUrl: resolveS3Url(song.artist.user.avatarUrl) }
      : null,
    album: song.album || null,
    genre: song.genre || null,
  };
}

/**
 * Search across songs, artists, albums.
 * @param {string} q         — search query (required)
 * @param {string} type      — 'all' | 'songs' | 'artists' | 'albums'
 * @param {number} limit     — max results per category (default 10, cap 50)
 */
async function search({ q, type = 'all', limit = 10 }) {
  if (!q || q.trim().length === 0) return { songs: [], artists: [], albums: [] };

  const take = Math.min(Number(limit), 50);
  const cacheKey = `search:${type}:${q.trim().toLowerCase()}:${take}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const keyword = q.trim();
  const result = { songs: [], artists: [], albums: [] };

  const searchSongs = type === 'all' || type === 'songs';
  const searchArtists = type === 'all' || type === 'artists';
  const searchAlbums = type === 'all' || type === 'albums';

  const [songs, artists, albums] = await Promise.all([
    searchSongs
      ? prisma.song.findMany({
          where: {
            status: 'published',
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { artist: { user: { displayName: { contains: keyword, mode: 'insensitive' } } } },
            ],
          },
          select: songSelect,
          orderBy: { playCount: 'desc' },
          take,
        })
      : Promise.resolve([]),

    searchArtists
      ? prisma.artist.findMany({
          where: {
            user: { displayName: { contains: keyword, mode: 'insensitive' } },
          },
          select: {
            id: true,
            bio: true,
            user: { select: { displayName: true, avatarUrl: true } },
            _count: { select: { followers: true } },
          },
          take,
        })
      : Promise.resolve([]),

    searchAlbums
      ? prisma.album.findMany({
          where: {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { artist: { user: { displayName: { contains: keyword, mode: 'insensitive' } } } },
            ],
          },
          select: {
            id: true,
            title: true,
            coverUrl: true,
            year: true,
            artist: { select: { id: true, user: { select: { displayName: true } } } },
          },
          take,
        })
      : Promise.resolve([]),
  ]);

  result.songs = songs.map(formatSong);
  result.artists = artists.map((a) => ({
    id: a.id,
    displayName: a.user.displayName,
    avatarUrl: resolveS3Url(a.user.avatarUrl),
    bio: a.bio,
    followerCount: a._count.followers,
  }));
  result.albums = albums.map((a) => ({
    id: a.id,
    title: a.title,
    coverUrl: resolveS3Url(a.coverUrl),
    year: a.year,
    artist: a.artist ? { id: a.artist.id, displayName: a.artist.user.displayName } : null,
  }));

  await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

module.exports = { search };
